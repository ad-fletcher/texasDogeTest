## Goal
Enforce a hard maximum of 25 rows across the analysis pipeline so that:
- SQL generation prefers “top 25” results when datasets are large
- Query execution never returns more than 25 rows from Supabase
- Chart generation only receives at most 25 data points

This preserves performance, reduces token usage, and keeps visuals readable.

## Current state (verified)
- Backend RPC `public.execute_analytics_query(query_text text)` adds `LIMIT 1000` if the incoming query has no LIMIT and returns JSON-aggregated rows.
- `lib/tools/databaseCodes.ts`
  - `generateAnalyticsQueryTool` produces SQL from NL with the schema context
  - `executeAnalyticsQueryTool` calls `execute_analytics_query` and returns results
  - `generateChartConfigTool` consumes the JSON results to produce chart config
- `app/api/chat/route.ts` orchestrates the tools
- `app/analyst/page.tsx` shows result metadata and currently says “(limited to 1000)”

## Implementation plan

### 1) Database safety net: clamp queries to 25 rows in RPC
Change the RPC so that it always enforces a hard limit (default 25) even if the provided query includes a higher LIMIT. This ensures nothing over 25 ever leaves the database.

SQL (run in Supabase SQL Editor):
```sql
CREATE OR REPLACE FUNCTION public.execute_analytics_query(
  query_text text,
  hard_limit integer DEFAULT 25
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '90s'
AS $function$
DECLARE
  result JSON;
  clean_query TEXT;
BEGIN
  -- Only allow SELECT queries
  IF NOT query_text ILIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries allowed';
  END IF;

  -- Block dangerous keywords
  IF query_text ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)' THEN
    RAISE EXCEPTION 'Unsafe query detected';
  END IF;

  -- Trim semicolon
  clean_query := trim(both ';' from query_text);

  -- Normalize any existing LIMIT to the hard_limit
  IF clean_query ~* 'LIMIT\s+\d+' THEN
    clean_query := regexp_replace(clean_query, 'LIMIT\s+\d+', 'LIMIT ' || hard_limit, 'i');
  ELSE
    clean_query := clean_query || ' LIMIT ' || hard_limit;
  END IF;

  -- Aggregate as JSON
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', clean_query) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$function$;
```

Notes:
- This replaces the previous “add LIMIT 1000 if missing” behavior with a parameterized hard limit (default 25) and clamps any existing LIMIT to 25.

### 2) SQL generation: prefer ORDER BY + LIMIT 25
Update `generateAnalyticsQueryTool` so the model always prefers “top 25” semantics:
- If the user asks for rankings/lists (top agencies/payees/categories, etc.), include `ORDER BY <primary_metric> DESC NULLS LAST` + `LIMIT 25`.
- If time series with grouping, still ensure final result set is <= 25 rows. Example: group by month (12 rows), or if grouping yields many categories, order by total/avg and cap at 25.

Edits in `lib/tools/databaseCodes.ts` (conceptual):
```ts
// In generateAnalyticsQueryTool system/prompt
// Add to “ENTITY RESOLUTION INTEGRATION” block:
// - Always cap results with LIMIT 25.
// - For large result sets, return TOP 25 by the primary metric (e.g., total_amount DESC, transaction_count DESC).
// - Prefer ORDER BY <metric> DESC NULLS LAST before LIMIT 25 to ensure deterministic top selection.
```

### 3) Query execution: enforce 25 at the application layer as well
Add a defensive layer that wraps any incoming SQL so the final payload to the RPC is already limited to 25.

Edits in `lib/tools/databaseCodes.ts`:
```ts
export const executeAnalyticsQueryTool = tool({
  description: 'Safely execute SQL queries against the Texas DOGE database',
  parameters: z.object({
    sqlQuery: z.string(),
    maxRows: z.number().default(25),
  }),
  execute: async ({ sqlQuery, maxRows = 25 }) => {
    try {
      if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
        return { error: 'Only SELECT queries are allowed', results: [] };
      }

      // Wrap to guarantee cap at maxRows (capped to 25 hard)
      const effectiveMax = Math.min(maxRows, 25);
      const limitedSql = `SELECT * FROM (${sqlQuery}) AS q LIMIT ${effectiveMax}`;

      const { data, error } = await supabase.rpc('execute_analytics_query', {
        query_text: limitedSql,
      });

      if (error) return { error: error.message, results: [] };

      const processed = (data || []).map((row: any) => {
        const r = { ...row };
        if (r.date) r.date = new Date(r.date).toISOString().split('T')[0];
        if (r.month) r.month = new Date(r.month).toISOString().split('T')[0];
        return r;
      });

      return {
        results: processed,
        rowCount: processed.length,
        hasMoreResults: processed.length === effectiveMax,
      };
    } catch (e) {
      return { error: 'Query execution failed', results: [] };
    }
  },
});
```

### 4) Chart generation: never accept more than 25 points
Add a final guard in `generateChartConfigTool` to clamp input data to 25.

Edits in `lib/tools/databaseCodes.ts`:
```ts
execute: async ({ queryResultsJson, originalQuestion, sqlQuery, entityContext }) => {
  try {
    const raw = JSON.parse(queryResultsJson);
    const queryResults = Array.isArray(raw) ? raw.slice(0, 25) : [];
    if (!queryResults.length) {
      return { chartConfig: null, message: 'No data available for chart generation' };
    }

    // Continue using queryResults (<= 25 items) for chart config generation
    // Sample, total count, etc.
  } catch (e) {
    // existing error handling
  }
}
```

### 5) Orchestrator guidance: document the cap in the system prompt
Edit `app/api/chat/route.ts` system prompt to include:
- “All analyses must be capped at 25 rows. Prefer TOP 25 by primary metric for large datasets.”
- “Always pass at most 25 items to the chart generation tool.”

This reduces chances of the model requesting oversized results.

### 6) Frontend copy: reflect the new cap
Edit `app/analyst/page.tsx` where query results are summarized:
```tsx
{/* Change “(limited to 1000)” → “(limited to 25)” */}
{result.hasMoreResults && ' (limited to 25)'}
```

### 7) Validation & tests
Manual tests to run after changes:
- Ask: “Show top 50 agencies by spending.”
  - Expect: Query with ORDER BY total DESC LIMIT 25; returned rowCount 25; UI shows “limited to 25”. Chart shows 25 bars max.
- Ask: “Monthly spending trends for 2022.”
  - Expect: If grouping is monthly, ≤12 rows; still within the cap; chart renders correctly.
- Ask: “Top payees by total amount.”
  - Expect: ≤ 25 results end-to-end, no more passed to chart.

### 8) Observability & guardrails
- Log `rowCount` in `executeAnalyticsQueryTool` and warn when `hasMoreResults === true` to signal truncation.
- If the use case requires paging later, design a “show more” or drill-down flow while keeping the default cap.

### 9) Rollout order
1. Update DB RPC (safe to deploy first; clamps over-limit queries immediately)
2. Ship code changes: generation prompt, execution wrapper, chart clamp
3. Update UI copy in `app/analyst/page.tsx`
4. Test scenarios above

### 10) Summary of changes by file
- `Supabase RPC`: Clamp to LIMIT 25 (regex replace or add LIMIT 25 if absent)
- `lib/tools/databaseCodes.ts`
  - `generateAnalyticsQueryTool`: prefer ORDER BY + LIMIT 25
  - `executeAnalyticsQueryTool`: wrap with outer LIMIT 25 and default `maxRows` to 25
  - `generateChartConfigTool`: slice results to 25 before building config
- `app/api/chat/route.ts`: add explicit guidance about 25-row cap in system prompt
- `app/analyst/page.tsx`: replace “limited to 1000” with “limited to 25”

