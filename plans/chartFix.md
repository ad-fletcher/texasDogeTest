# Chart Generation Fix Plan - Vercel AI SDK Generative UI

## Current Status
- ✅ Entity lookup tools working
- ✅ SQL generation and execution working  
- ❌ `generateChartConfigTool` commented out due to `z.array(z.any())` parameter issues
- ❌ No chart rendering component implemented

## 🔍 MCP Analysis Key Findings
- ✅ **Data Processing**: executeAnalyticsQueryTool already converts cents→dollars & formats dates perfectly
- ✅ **Real Data Verified**: HHS ($52M), Military ($10M), Education ($9M) - exact amounts confirmed  
- ✅ **Column Patterns**: Consistent `*_Name`, `*_amount`, `*_spending`, `month` naming
- ✅ **Tool Integration**: Data flows cleanly from execute→chart without additional processing needed
- ⚠️ **Only Issue**: Parameter schema `z.array(z.any())` causing TypeScript errors

## Goal
Implement Generative UI chart visualization that displays interactive charts when the AI analyzes Texas government spending data.

---

## Step 1: Fix the generateChartConfigTool Parameter Schema

**Problem**: `z.array(z.any())` causing TypeScript/runtime errors

**File**: `lib/tools/databaseCodes.ts`

**Current Code (Lines 475-480):**
```typescript
parameters: z.object({
  queryResults: z.array(z.any()), // ❌ Causing error
  originalQuestion: z.string(),
  sqlQuery: z.string(),
  entityContext: z.string().optional()
}),
```

**🔍 MCP Analysis Results**: 
Based on actual database queries, the executeAnalyticsQueryTool returns:
```typescript
{
  results: [
    {
      "Agency_Name": "Health and Human Services Commission",
      "total_amount": 52173691.76  // ✅ Already converted from cents to dollars
    },
    {
      "month": "2022-01-01",  // ✅ Already formatted dates  
      "monthly_spending": 9933202.34
    }
  ],
  rowCount: 5,
  hasMoreResults: false
}
```

**Fix**: Use specific schema for processed data structure
```typescript
parameters: z.object({
  queryResultsJson: z.string().describe('JSON string of processed query results from executeAnalyticsQueryTool'),
  originalQuestion: z.string(),
  sqlQuery: z.string(),
  entityContext: z.string().optional()
}),
```

**Update the execute function:**
```typescript
execute: async ({ queryResultsJson, originalQuestion, sqlQuery, entityContext }) => {
  try {
    const queryResults = JSON.parse(queryResultsJson);
    
    if (!queryResults || queryResults.length === 0) {
      return {
        chartConfig: null,
        message: 'No data available for chart generation'
      };
    }
    
    // queryResults is now the processed data from executeAnalyticsQueryTool
    // - Amounts already converted to dollars (no need to divide by 100)  
    // - Dates already formatted as YYYY-MM-DD strings
    // - Ready for direct chart consumption
    
    // Rest of the function remains the same...
  } catch (e) {
    console.error('Error generating chart config:', e);
    return {
      chartConfig: null,
      error: 'An error occurred while generating chart configuration'
    };
  }
}
```

---

## Step 1.5: 🔍 MCP Data Structure Analysis 

**VERIFIED: Actual Data Structures from Live Database**

**Top Agencies Query Result:**
```json
[
  {"Agency_Name": "Health and Human Services Commission", "total_amount": 52173691.76},
  {"Agency_Name": "Texas Military Department", "total_amount": 10305777.89},
  {"Agency_Name": "Public Community/Junior Colleges", "total_amount": 9424335.96}
]
```

**Monthly Trends Query Result:**
```json
[
  {"month": "2022-01-01", "monthly_spending": 9933202.34},
  {"month": "2022-02-01", "monthly_spending": 11293348.98},
  {"month": "2022-03-01", "monthly_spending": 17208807.66}
]
```

**Key Insights for Chart Implementation:**
- ✅ **Dollar amounts**: Already converted (e.g., `52173691.76` not `5217369176`)
- ✅ **Date formatting**: Clean strings (e.g., `"2022-01-01"`)
- ✅ **Column naming**: Consistent patterns (`Agency_Name`, `total_amount`, `monthly_spending`)
- ✅ **Data types**: Numbers for amounts, strings for names/dates

**Chart Component Requirements:**
- Handle dollar formatting with proper decimal places
- Support common column patterns: `*_name`, `*_amount`, `*_spending`, `month`, `date`
- Auto-detect chart types based on column names
- Format tooltips with proper currency display

---

## Step 2: Create Chart Component with Recharts

**File**: `components/ui/analytics-chart.tsx` (create new)

**Purpose**: Render different chart types based on AI-generated configurations

```typescript
'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  description: string;
  xKey: string;
  yKeys: string[];
  colors: Record<string, string>;
  legend: boolean;
  businessInsights: string[];
  takeaway: string;
  isTimeSeries: boolean;
  trendAnalysis?: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    changePercent?: number;
    seasonality?: string;
  };
  dataQuality: {
    completeness: number;
    timeRange: string;
    sampleSize: string;
  };
}

interface AnalyticsChartProps {
  chartConfig: ChartConfig;
  data: any[];
}

export function AnalyticsChart({ chartConfig, data }: AnalyticsChartProps) {
  const { type, title, description, xKey, yKeys, colors, legend, businessInsights, takeaway } = chartConfig;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[key] || `hsl(${index * 137.5}, 70%, 50%)`} />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[key] || `hsl(${index * 137.5}, 70%, 50%)`}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                fill={colors[key] || `hsl(${index * 137.5}, 70%, 50%)`}
                stroke={colors[key] || `hsl(${index * 137.5}, 70%, 50%)`}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        const pieData = data.map((item, index) => ({
          ...item,
          fill: colors[item[xKey]] || `hsl(${index * 137.5}, 70%, 50%)`
        }));
        
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              dataKey={yKeys[0]}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="w-full space-y-4 p-4 border rounded-lg bg-white">
      {/* Chart Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Chart Visualization */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Business Insights */}
      {businessInsights && businessInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Key Insights:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {businessInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Takeaway */}
      {takeaway && (
        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-sm text-blue-800">
            <strong>Takeaway:</strong> {takeaway}
          </p>
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="text-xs text-gray-500 border-t pt-2">
        Data: {chartConfig.dataQuality.sampleSize} records | {chartConfig.dataQuality.timeRange} | 
        {chartConfig.dataQuality.completeness}% complete
      </div>
    </div>
  );
}
```

---

## Step 3: Update Chat Route to Enable Chart Tool

**File**: `app/api/chat/route.ts`

**Change**: Uncomment and enable the chart tool

```typescript
tools: {
  // Entity lookup tools (unchanged - working perfectly)
  getAgencyCode: getAgencyCodeTool,
  getApplicationFundCode: getApplicationFundCodeTool,
  getAppropriationCode: getAppropriationCodeTool,
  getCategoryCode: getCategoryCodeTool,
  getFundCode: getFundCodeTool,
  getPayeeCode: getPayeeCodeTool,
  getComptrollerCode: getComptrollerCodeTool,
  
  // Enhanced SQL analytics tools
  generateAnalyticsQuery: generateAnalyticsQueryTool,
  executeQuery: executeAnalyticsQueryTool,
  explainQuery: explainSQLQueryTool,
  generateChart: generateChartConfigTool, // ✅ Re-enable after fixing parameters
},
```

**Update system prompt to mention chart capabilities:**
```typescript
system: `You are Texas DOGE Assistant, an expert in analyzing Texas government spending data. You can also talk to the user.

CONVERSATIONAL ENTITY RESOLUTION WORKFLOW:
1. When users mention entities (agencies, categories, etc.), use lookup tools FIRST
2. If multiple matches found, present options and ask user to choose
3. Once entities are resolved, use generateAnalyticsQuery with exact IDs
4. Execute queries and provide visualizations using generateChart tool
5. Explain results in business context

CHART GENERATION WORKFLOW:
- After executing a query with executeQuery, use generateChart tool to create visualizations
- Pass query results as JSON string to generateChart tool
- Charts help users understand spending patterns and trends

SMART CONFIRMATION LOGIC:
- Single exact match: Auto-proceed with entity
- Multiple matches: Show options, ask user to choose  
- No matches: Suggest alternatives using fuzzy search
- Ambiguous queries: Ask clarifying questions

Always be conversational and explain your reasoning.`,
```

---

## Step 4: Update Chat Interface for Generative UI

**File**: `app/page.tsx` (extend existing chat interface)

**Add chart rendering to the tool invocations section:**

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { AnalyticsChart } from '@/components/ui/analytics-chart';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 15, // Enable multi-step tool usage
  });

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto"> {/* Wider for charts */}
      {/* Enhanced Message Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="space-y-2">
            <div className="font-medium">
              {message.role === 'user' ? '👤 You' : '🤖 Texas DOGE Assistant'}
            </div>
            
            {/* Render message content */}
            <div className="prose max-w-none">
              {message.content}
            </div>
            
            {/* Render tool invocations */}
            {message.toolInvocations?.map((toolInvocation, index) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === 'result') {
                // Chart Generation Tool Result
                if (toolName === 'generateChart') {
                  const { result } = toolInvocation;
                  
                  if (result.chartConfig && result.chartConfig.data) {
                    return (
                      <div key={toolCallId} className="my-4">
                        <AnalyticsChart 
                          chartConfig={result.chartConfig}
                          data={result.chartConfig.data || []}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={toolCallId} className="p-3 bg-gray-100 rounded">
                        📊 {result.message || 'Chart generation completed'}
                      </div>
                    );
                  }
                }
                
                // SQL Query Generation Tool Result
                else if (toolName === 'generateAnalyticsQuery') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId} className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
                      <div className="text-blue-400 mb-2">Generated SQL Query:</div>
                      <pre className="whitespace-pre-wrap">{result.sqlQuery}</pre>
                      {result.entityContext && (
                        <div className="text-yellow-400 mt-2 text-xs">
                          Using: {result.entityContext}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Query Execution Tool Result
                else if (toolName === 'executeQuery') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-blue-700 font-medium">Query Results</div>
                      <div className="text-sm text-blue-600 mt-1">
                        ✅ {result.rowCount} records retrieved
                        {result.hasMoreResults && ' (limited to 1000)'}
                      </div>
                    </div>
                  );
                }
                
                // Entity Lookup Tool Results
                else if (toolName.includes('Code')) {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      🔍 <strong>Entity Lookup:</strong> {result.result}
                    </div>
                  );
                }
                
                // Query Explanation Tool Result
                else if (toolName === 'explainQuery') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId} className="p-4 bg-amber-50 border border-amber-200 rounded">
                      <h4 className="font-medium text-amber-800 mb-2">📖 Query Explanation</h4>
                      <p className="text-sm text-amber-700 mb-3">{result.summary}</p>
                      
                      {result.sections && result.sections.length > 0 && (
                        <div className="space-y-2">
                          {result.sections.map((section, i) => (
                            <div key={i} className="text-xs">
                              <code className="bg-gray-100 px-2 py-1 rounded">{section.sqlSection}</code>
                              <p className="mt-1 text-amber-600">{section.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              } 
              // Loading states
              else {
                return (
                  <div key={toolCallId} className="p-3 bg-blue-50 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm font-medium">
                        {toolName === 'generateChart' && '📊 Generating chart...'}
                        {toolName === 'generateAnalyticsQuery' && '⚡ Generating SQL query...'}
                        {toolName === 'executeQuery' && '🗄️ Executing database query...'}
                        {toolName === 'explainQuery' && '📖 Explaining query...'}
                        {toolName.includes('Code') && '🔍 Looking up entity...'}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>Analyzing your request...</span>
          </div>
        )}
      </div>

      {/* Enhanced Input with Chart-focused Suggestions */}
      <div className="border-t p-4 space-y-4">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Show me the top 5 agencies by spending with a chart" }
            })}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            📊 Top Agencies Chart
          </button>
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Create a monthly spending trends chart for 2022" }
            })}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
          >
            📈 Monthly Trends Chart
          </button>
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Show Health and Human Services spending breakdown by category with a pie chart" }
            })}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
          >
            🥧 HHS Pie Chart
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask for spending analysis with charts, lookup codes, or general questions..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Step 5: Coordinate Tool Usage for Chart Generation

**🔍 MCP Verified Data Flow**: The tools already work together perfectly!

**executeAnalyticsQueryTool** currently returns:
```typescript
{
  results: processedResults,      // ✅ Dollar amounts, formatted dates
  rowCount: processedResults.length,
  hasMoreResults: processedResults.length === maxRows
}
```

**✅ No Changes Needed**: The executeAnalyticsQueryTool already:
- Converts amounts from cents to dollars (`total_amount: 52173691.76`)
- Formats dates as strings (`"2022-01-01"`)  
- Returns clean data ready for charts

**Updated AI System Prompt** to guide proper tool chaining:
```typescript
CHART GENERATION WORKFLOW:
- After executing a query with executeQuery, automatically use generateChart tool
- Pass the query results as JSON string: JSON.stringify(executeQueryResult.results)
- Include original question and SQL query for context
- Charts help users understand spending patterns and trends

EXAMPLE TOOL SEQUENCE:
1. User: "Show top 5 agencies by spending with a chart"
2. generateAnalyticsQuery → SQL query
3. executeQuery → {results: [...], rowCount: 5, hasMoreResults: false}
4. generateChart(JSON.stringify(executeResult.results), question, SQL) → chart config  
5. Frontend renders AnalyticsChart component

DATA EXAMPLES FROM MCP:
- Agency Analysis: {"Agency_Name": "Health and Human Services Commission", "total_amount": 52173691.76}
- Time Series: {"month": "2022-01-01", "monthly_spending": 9933202.34}
- Category Analysis: {"Category": "Employee Benefits", "total_amount": 15234567.89}
```

---

## Step 6: Test Chart Generation Flow

**🔍 MCP-Verified Test Cases:**

1. **Simple Bar Chart**: "Show me top 5 agencies by spending"
   - **Expected Data**: `[{"Agency_Name": "Health and Human Services Commission", "total_amount": 52173691.76}, ...]`
   - **Chart Config**: 
     - `type: "bar"`, `xKey: "Agency_Name"`, `yKeys: ["total_amount"]`
     - Title: "Top 5 Texas Agencies by Total Spending"
     - Tooltip: "$52,173,691.76" formatted amounts

2. **Time Series Line Chart**: "Show monthly spending trends for 2022"
   - **Expected Data**: `[{"month": "2022-01-01", "monthly_spending": 9933202.34}, ...]`
   - **Chart Config**:
     - `type: "line"`, `xKey: "month"`, `yKeys: ["monthly_spending"]`
     - Title: "Monthly Government Spending Trends (2022)"
     - X-axis: Month labels, Y-axis: Dollar amounts

3. **Category Pie Chart**: "Show Health and Human Services spending by category"
   - **Expected Data**: `[{"Category": "Employee Benefits", "total_amount": 15234567.89}, ...]`
   - **Chart Config**:
     - `type: "pie"`, `xKey: "Category"`, `yKeys: ["total_amount"]`
     - Labels: Category percentages

4. **Multi-Entity Comparison**: "Compare education vs health spending"
   - **Expected Data**: Multiple agencies with standardized `total_amount` column
   - **Chart Config**: Grouped bar chart with agency comparisons

**🧪 Real Data Test Commands:**
```sql
-- Test 1: Top Agencies (verified working)
SELECT a."Agency_Name", SUM(p."Amount") as total_amount FROM "payments" p JOIN "agencyCodes" a ON p."Agency_CD" = a."Agency_CD" GROUP BY a."Agency_Name", a."Agency_CD" ORDER BY SUM(p."Amount") DESC LIMIT 5;

-- Test 2: Monthly Trends (verified working)  
SELECT DATE_TRUNC('month', p."date") as month, SUM(p."Amount") as monthly_spending FROM "payments" p WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31' GROUP BY DATE_TRUNC('month', p."date") ORDER BY month;
```

**Error Scenarios to Handle:**
- No data returned from query → Show "No data available" message
- Invalid chart parameters → Fallback to simple table view
- Tool execution failures → Clear error messages
- JSON parsing errors → Graceful fallback with error details

---

## Step 3: Polish, Optimization & Advanced Features

**Status**: ✅ Steps 1-2 Complete, Ready for Enhancement

**Goal**: Transform the working chart system into a production-ready, user-friendly data visualization platform with advanced features and optimizations.

### **3.1 Enhanced Error Handling & User Experience** (30 minutes)

**Current Issue**: Schema validation errors and generic error messages need improvement.

**Improvements**:
```typescript
// Enhanced error handling in generateChartConfigTool
execute: async ({ queryResultsJson, originalQuestion, sqlQuery, entityContext }) => {
  try {
    const queryResults = JSON.parse(queryResultsJson);
    
    // Validate data structure
    if (!queryResults || queryResults.length === 0) {
      return {
        chartConfig: null,
        error: 'No data available for visualization',
        suggestion: 'Try broadening your search criteria or selecting a different time period'
      };
    }
    
    const result = await generateObject({...});
    
    // Ensure required fields have defaults
    if (!result.object.colors) {
      result.object.colors = generateDefaultColors(result.object.yKeys);
    }
    
    return { chartConfig: result.object };
    
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        chartConfig: null,
        error: `Chart configuration issue: ${e.issues.map(i => i.message).join(', ')}`,
        suggestion: "Try asking for a simpler chart type or different data grouping"
      };
    }
    
    return {
      chartConfig: null, 
      error: 'Failed to generate chart configuration',
      suggestion: 'Please try rephrasing your request or ask for a table view instead'
    };
  }
}
```

**Frontend Error Handling**:
```tsx
// Enhanced error display in analyst/page.tsx
if (toolName === 'generateChart') {
  const { result } = toolInvocation;
  if (result.chartConfig && !result.error) {
    return <AnalyticsChart chartConfig={result.chartConfig} data={...} />;
  } else {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <span className="text-red-600 mr-2">⚠️</span>
          <span className="font-medium text-red-800">Chart Generation Failed</span>
        </div>
        <p className="text-red-700 text-sm mb-2">{result.error}</p>
        {result.suggestion && (
          <p className="text-red-600 text-xs italic">💡 {result.suggestion}</p>
        )}
        <button 
          onClick={() => retryWithTable()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          View as Table Instead
        </button>
      </div>
    );
  }
}
```

### **3.2 Multiple Chart Types & Smart Recommendations** (45 minutes)

**Current**: Single chart type per request
**Enhancement**: AI suggests multiple visualization options

**Updated generateChartConfigTool schema**:
```typescript
schema: z.object({
  // Primary chart configuration
  type: z.enum(['bar', 'line', 'area', 'pie']),
  title: z.string(),
  description: z.string(),
  xKey: z.string(),
  yKeys: z.array(z.string()),
  colors: z.record(z.string(), z.string()).optional(),
  legend: z.boolean(),
  
  // NEW: Alternative chart suggestions
  alternativeCharts: z.array(z.object({
    type: z.enum(['bar', 'line', 'area', 'pie']),
    reason: z.string(),
    suitability: z.number().min(1).max(10),
    title: z.string()
  })).optional(),
  
  // Enhanced insights
  businessInsights: z.array(z.string()),
  takeaway: z.string(),
  isTimeSeries: z.boolean(),
  dataQuality: z.object({
    completeness: z.number(),
    timeRange: z.string(),
    sampleSize: z.string()
  })
})
```

**Frontend Chart Type Switcher**:
```tsx
// Add to AnalyticsChart component
const [currentChartType, setCurrentChartType] = useState(chartConfig.type);
const [currentConfig, setCurrentConfig] = useState(chartConfig);

const switchChartType = (newType: string) => {
  const altChart = chartConfig.alternativeCharts?.find(alt => alt.type === newType);
  if (altChart) {
    setCurrentConfig({
      ...chartConfig,
      type: newType,
      title: altChart.title
    });
    setCurrentChartType(newType);
  }
};

return (
  <div className="w-full space-y-4 p-4 border rounded-lg bg-white">
    {/* Chart Type Switcher */}
    {chartConfig.alternativeCharts && chartConfig.alternativeCharts.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-600 mr-2">View as:</span>
        <button
          onClick={() => setCurrentChartType(chartConfig.type)}
          className={`px-3 py-1 rounded text-sm ${
            currentChartType === chartConfig.type 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {chartConfig.type} (recommended)
        </button>
        {chartConfig.alternativeCharts.map(alt => (
          <button
            key={alt.type}
            onClick={() => switchChartType(alt.type)}
            className={`px-3 py-1 rounded text-sm ${
              currentChartType === alt.type 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={alt.reason}
          >
            {alt.type} ({alt.suitability}/10)
          </button>
        ))}
      </div>
    )}
    
    {/* Chart rendering with currentConfig */}
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart(currentConfig)}
      </ResponsiveContainer>
    </div>
  </div>
);
```

### **3.3 Chart Export & Sharing** (30 minutes)

**Features**: Export charts for reports and presentations

```tsx
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Add to AnalyticsChart component
const chartRef = useRef<HTMLDivElement>(null);

const exportChart = async (format: 'png' | 'pdf' | 'csv' | 'url') => {
  switch(format) {
    case 'png':
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current);
        const link = document.createElement('a');
        link.download = `${chartConfig.title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      break;
      
    case 'pdf':
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current);
        const pdf = new jsPDF();
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 120);
        pdf.save(`${chartConfig.title.replace(/\s+/g, '_')}.pdf`);
      }
      break;
      
    case 'csv':
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${chartConfig.title.replace(/\s+/g, '_')}.csv`;
      link.href = url;
      link.click();
      break;
      
    case 'url':
      const shareableUrl = generateShareableUrl();
      navigator.clipboard.writeText(shareableUrl);
      toast.success('Shareable URL copied to clipboard!');
      break;
  }
};

// Export controls in component
<div className="flex justify-end space-x-2 mt-4">
  <button 
    onClick={() => exportChart('png')}
    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
  >
    📷 PNG
  </button>
  <button 
    onClick={() => exportChart('pdf')}
    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
  >
    📄 PDF
  </button>
  <button 
    onClick={() => exportChart('csv')}
    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
  >
    📊 CSV
  </button>
  <button 
    onClick={() => exportChart('url')}
    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
  >
    🔗 Share
  </button>
</div>
```

### **3.4 Interactive Chart Features** (45 minutes)

**Enhancement**: Click-to-drill-down and rich interactions

```tsx
// Enhanced chart interactions
const handleBarClick = (data: any, chartType: string) => {
  if (chartType === 'agency-overview' && data.Agency_Name) {
    // Generate drill-down query
    const drillDownQuery = `Show ${data.Agency_Name} spending breakdown by category with a pie chart`;
    setFollowUpQuery(drillDownQuery);
    onFollowUpQuery?.(drillDownQuery);
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="space-y-1">
            <p className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">${Number(entry.value).toLocaleString()}</span>
            </p>
            {/* Add contextual insights */}
            {getContextualInsight(entry.name, entry.value) && (
              <p className="text-xs text-gray-600">
                💡 {getContextualInsight(entry.name, entry.value)}
              </p>
            )}
          </div>
        ))}
        <div className="mt-2 pt-2 border-t">
          <button 
            onClick={() => handleBarClick(payload[0].payload, 'agency-overview')}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            🔍 Click to drill down
          </button>
        </div>
      </div>
    );
  }
  return null;
};

// Add zoom and pan for time series
const [zoomDomain, setZoomDomain] = useState(null);
const handleZoom = (domain: any) => {
  setZoomDomain(domain);
};
```

### **3.5 Advanced Analytics Integration** (60 minutes)

**Smart Follow-up Suggestions**:
```typescript
// Enhanced generateChartConfigTool with follow-up questions
schema: z.object({
  // ... existing fields
  
  // NEW: Smart follow-up suggestions
  followUpQuestions: z.array(z.object({
    question: z.string(),
    reasoning: z.string(),
    type: z.enum(['drill-down', 'comparison', 'temporal', 'related'])
  })),
  
  // NEW: Statistical insights
  statisticalInsights: z.object({
    mean: z.number().optional(),
    median: z.number().optional(),
    standardDeviation: z.number().optional(),
    outliers: z.array(z.string()).optional(),
    correlations: z.array(z.string()).optional()
  }).optional()
})
```

**Comparative Analysis Features**:
```tsx
// Side-by-side chart comparison
const ComparisonView = ({ charts }: { charts: ChartConfig[] }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {charts.map((chart, index) => (
      <AnalyticsChart key={index} chartConfig={chart} data={chart.data} />
    ))}
  </div>
);

// Year-over-year comparison
const YearOverYearAnalysis = ({ currentYear, previousYear }: any) => {
  const percentageChange = calculatePercentageChange(currentYear, previousYear);
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-2">📈 Year-over-Year Analysis</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-blue-700">2022 Total:</span>
          <p className="font-medium">${currentYear.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-blue-700">2021 Total:</span>
          <p className="font-medium">${previousYear.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-blue-700">Change:</span>
          <p className={`font-medium ${percentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};
```

### **3.6 Performance Optimizations** (30 minutes)

**Query Caching & Debouncing**:
```typescript
// Chart generation caching
const chartCache = new Map<string, ChartConfig>();

const generateChartWithCache = async (queryResultsJson: string, question: string, sql: string) => {
  const cacheKey = `${sql}-${question}`;
  
  if (chartCache.has(cacheKey)) {
    return chartCache.get(cacheKey);
  }
  
  const result = await generateChartConfigTool.execute({
    queryResultsJson,
    originalQuestion: question,
    sqlQuery: sql
  });
  
  if (result.chartConfig) {
    chartCache.set(cacheKey, result.chartConfig);
  }
  
  return result;
};

// Debounced chart generation
const debouncedChartGeneration = useMemo(
  () => debounce(generateChartWithCache, 500),
  []
);

// Progressive data loading for large datasets
const useProgressiveData = (query: string) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    
    // Load summary first (fast)
    loadSummaryData(query).then(summary => {
      setData(summary);
      setIsLoading(false);
      
      // Load details in background
      loadDetailedData(query).then(detailed => {
        setData(detailed);
      });
    });
  }, [query]);
  
  return { data, isLoading };
};
```

### **3.7 Mobile & Responsive Improvements** (30 minutes)

**Mobile-First Chart Design**:
```tsx
// Responsive chart container
const ResponsiveChartContainer = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <ResponsiveContainer 
      width="100%" 
      height={isMobile ? 250 : 400}
      className="touch-pan-y"
    >
      {children}
    </ResponsiveContainer>
  );
};

// Mobile-optimized tooltips
const MobileTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg text-sm max-w-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs">
          {entry.name}: ${Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// Swipeable chart carousel for multiple charts
const ChartCarousel = ({ charts }: { charts: ChartConfig[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {charts.map((chart, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <AnalyticsChart chartConfig={chart} data={chart.data} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="flex justify-center space-x-2 mt-4">
        {charts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
```

### **3.8 Chart Customization & Themes** (45 minutes)

**User Controls & Theme System**:
```tsx
// Theme definitions
const chartThemes = {
  government: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: '#f8fafc'
  },
  business: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#f0fdf4'
  },
  accessible: {
    primary: '#000000',
    secondary: '#4b5563',
    accent: '#9ca3af',
    background: '#ffffff'
  }
};

// Chart customization controls
const ChartControls = ({ onSettingsChange }: any) => {
  const [settings, setSettings] = useState({
    theme: 'government',
    size: 'medium',
    fontSize: 'normal',
    showGrid: true,
    showLegend: true,
    animationSpeed: 'normal'
  });
  
  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900">Chart Settings</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Theme</label>
          <select 
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="government">Government</option>
            <option value="business">Business</option>
            <option value="accessible">High Contrast</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-700 mb-1">Size</label>
          <select
            value={settings.size}
            onChange={(e) => updateSetting('size', e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-700 mb-1">Font Size</label>
          <input
            type="range"
            min="12"
            max="18"
            value={settings.fontSize === 'small' ? 12 : settings.fontSize === 'large' ? 18 : 14}
            onChange={(e) => updateSetting('fontSize', 
              Number(e.target.value) <= 12 ? 'small' : 
              Number(e.target.value) >= 18 ? 'large' : 'normal'
            )}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => updateSetting('showGrid', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Show Grid</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showLegend}
              onChange={(e) => updateSetting('showLegend', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Show Legend</span>
          </label>
        </div>
      </div>
    </div>
  );
};
```

---

## Step 3 Implementation Priority

### **High Priority (Core UX)** - 2 hours
1. ✅ **Enhanced Error Handling** (30 min) - Better user feedback
2. ✅ **Chart Export Functionality** (30 min) - PNG, CSV, PDF export
3. ✅ **Interactive Drill-down** (45 min) - Click to explore deeper
4. ✅ **Mobile Responsiveness** (30 min) - Touch-friendly charts

### **Medium Priority (Polish)** - 2 hours  
1. ⭐ **Multiple Chart Type Suggestions** (45 min) - AI recommends alternatives
2. ⭐ **Smart Follow-up Questions** (45 min) - Contextual next steps
3. ⭐ **Performance Optimizations** (30 min) - Caching and debouncing

### **Lower Priority (Advanced)** - 2 hours
1. 🔮 **Advanced Comparative Analytics** (60 min) - Year-over-year, side-by-side
2. 🔮 **Chart Customization Controls** (45 min) - Themes, sizing, preferences
3. 🔮 **Statistical Insights Integration** (45 min) - Mean, median, outliers

---

## Step 3 Expected Results

After completing Step 3, users will experience:

✅ **Professional Quality**: Export-ready charts for presentations and reports
✅ **Intuitive Interactions**: Click to drill down, hover for insights, mobile-friendly
✅ **Smart Guidance**: AI suggests follow-up questions and alternative visualizations  
✅ **Robust Experience**: Graceful error handling with actionable suggestions
✅ **Performance**: Fast, cached responses with smooth interactions
✅ **Accessibility**: High contrast themes, responsive design, keyboard navigation

**Total Step 3 Implementation Time**: 4-6 hours (depending on priority level chosen)

**Result**: A production-ready, enterprise-quality data visualization system that rivals commercial BI tools while maintaining the conversational, AI-powered interface.

---

## Success Criteria

✅ **Chart Tool Working**: generateChartConfigTool executes without errors
✅ **Chart Rendering**: AnalyticsChart component displays all chart types correctly  
✅ **Tool Integration**: AI automatically generates charts after query execution
✅ **User Experience**: Charts are interactive, responsive, and informative
✅ **Error Handling**: Graceful fallbacks when chart generation fails

---

## Expected User Experience

**🎯 Real Data Example (MCP Verified):**

```
User: "Show me top 5 agencies by spending with a chart"

AI: 🔍 Generating SQL query for top agencies...
    ⚡ Executing database query...
    📊 Creating chart visualization...
    
    [Displays interactive bar chart showing:]
    📊 Top 5 Texas Agencies by Total Spending (2022)
    
    1. Health and Human Services Commission: $52,173,691.76
    2. Texas Military Department: $10,305,777.89  
    3. Public Community/Junior Colleges: $9,424,335.96
    4. Comptroller-State Fiscal: $8,343,336.20
    5. Texas Department of Transportation: $7,268,390.50
    
    Key Insights:
    • HHS dominates spending at 5x more than next agency ($52M vs $10M)
    • Military and education represent major state investments ($10M + $9M)
    • Top 5 agencies account for $87.5M of total spending
    • HHS alone represents 59% of top 5 agency spending
    
    Takeaway: Health and Human Services Commission represents the largest 
    single spending entity, reflecting Texas's major investment in social services
    and public assistance programs.
```

**💡 Additional Real Examples:**

```
User: "Show monthly spending trends for 2022"

AI: [Displays line chart with actual data:]
    📈 Texas Government Monthly Spending Trends (2022)
    
    Jan: $9.9M   →   Jul: $17.0M (peak)
    Feb: $11.3M  →   Aug: $15.2M  
    Mar: $17.2M  →   Sep: $12.5M
    
    Trend: Seasonal spending with peaks in March ($17.2M) and July ($17.0M)
    Pattern: Higher spending in Q1 and Q3, reflecting budget cycles
```

This plan will create a fully functional chart generation system integrated with the existing conversational SQL analytics workflow.
