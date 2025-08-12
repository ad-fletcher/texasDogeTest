# Plan: Give AI Agent Access to Agency Code Database

This plan outlines the steps to connect your AI agent to a Supabase database, allowing it to fetch agency codes based on user queries. It will use a fuzzy search to find relevant agency names from the `agencyCodes` table as described in `dataBase.md`.

### Step 1: Set Up Supabase and Environment

First, you need to configure your project to communicate with your Supabase database.

1.  **Install Supabase Client:**
    Add the Supabase JavaScript client to your project.
    ```bash
    pnpm add @supabase/supabase-js
    ```

2.  **Get Supabase Credentials:**
    - Go to your Supabase project dashboard.
    - Navigate to **Project Settings** > **API**.
    - Find your **Project URL** and **Project API Keys** (you'll need the `anon` key).

3.  **Set Up Environment Variables:**
    - Create a new file named `.env.local` in the root of your project if it doesn't exist.
    - Add your Supabase credentials to this file. **Never commit this file to git.**

    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

### Step 2: Implement Fuzzy Search in Supabase

For efficient fuzzy searching, it's best to handle it directly within the database using a PostgreSQL function and the `pg_trgm` extension.

1.  **Enable `pg_trgm` Extension:**
    - In your Supabase dashboard, go to **Database** > **Extensions**.
    - Find `pg_trgm` in the list and enable it. This extension provides functions and operators for determining the similarity of text.

2.  **Create a Database Function:**
    - Go to the **SQL Editor** in your Supabase dashboard.
    - Create a new query to define a function that performs the fuzzy search on the `agencyCodes` table.

    ```sql
    CREATE OR REPLACE FUNCTION search_agencies(search_term TEXT)
    RETURNS TABLE (
      agency_name TEXT,
      agency_cd BIGINT,
      similarity REAL
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        "Agency_Name",
        "Agency_CD",
        similarity("Agency_Name", search_term)
      FROM
        "agencyCodes"
      WHERE
        similarity("Agency_Name", search_term) > 0.3 -- Adjust this threshold as needed
      ORDER BY
        similarity DESC
      LIMIT 10;
    END;
    $$ LANGUAGE plpgsql;
    ```
    - This function, `search_agencies`, takes a search term, compares it against `Agency_Name` using the `similarity` function from `pg_trgm`, and returns the top 10 matches above a certain similarity threshold.

### Step 3: Create the Supabase Client and Tool

Now, let's create the tool for your AI agent.

1.  **Create a Supabase Client Utility:**
    - In your `lib` folder, create a new file `lib/supabase.ts` to initialize and export a Supabase client instance.

    ```typescript
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
    ```

2.  **Define the Tool in `route.ts`:**
    - Open `app/api/chat/route.ts`.
    - Import the supabase client and add a new tool for fetching agency codes.

    ```typescript
    import { openai } from '@ai-sdk/openai';
    import { streamText, tool } from 'ai';
    import { z } from 'zod';
    import { supabase } from '../../../lib/supabase'; // Adjust path if needed

    export const maxDuration = 30;

    export async function POST(req: Request) {
      const { messages } = await req.json();

      const result = streamText({
        model: openai('gpt-4o'),
        messages,
        tools: {
          weather: tool({
            /* existing weather tool */
          }),
          getAgencyCode: tool({
            description: 'Get the agency code for an agency name. Uses fuzzy search.',
            parameters: z.object({
              agencyName: z.string().describe('The name of the agency to search for.'),
            }),
            execute: async ({ agencyName }) => {
              const { data, error } = await supabase.rpc('search_agencies', {
                search_term: agencyName,
              });

              if (error) {
                console.error('Supabase RPC error:', error);
                return { error: 'Failed to query the database.' };
              }
              
              if (!data || data.length === 0) {
                return { message: `No agency found for "${agencyName}".` };
              }

              if (data.length === 1) {
                return {
                  message: `The agency code for ${data[0].agency_name} is ${data[0].agency_cd}.`,
                  agencyName: data[0].agency_name,
                  agencyCode: data[0].agency_cd,
                };
              }

              return {
                message: `Found multiple possible agencies for "${agencyName}".`,
                agencies: data.map(item => ({
                  name: item.agency_name,
                  code: item.agency_cd,
                })),
              };
            },
          }),
        },
      });

      return result.toDataStreamResponse();
    }
    ```
    - **Note:** The `execute` function now calls the `search_agencies` RPC function we created in Supabase. It handles cases for errors, no results, a single result, and multiple results.

### Step 4: Refactor Tools for Better Code Organization

For better maintainability and code organization, it's recommended to separate your AI tools into dedicated files rather than keeping them inline in the API route.

1.  **Create a Database Tools File:**
    - Create a new file `lib/tools/database.ts` to house all database-related tools.
    - This follows the existing pattern in your project where you already have `lib/tools/math.ts`.

    ```typescript
    import { tool } from 'ai';
    import { z } from 'zod';
    import { supabase } from '../supabase';

    export const getAgencyCodeTool = tool({
      description: 'Get the agency code for an agency name. Uses fuzzy search to return agencies from the database with fuzzy search.',
      parameters: z.object({
        agencyName: z.string().describe('The name of the agency to search for.'),
      }),
      execute: async ({ agencyName }) => {
        try {
          console.log('search_term', agencyName);
          const { data, error } = await supabase.rpc('search_agencies_case_insensitive', {
            search_term: agencyName,
          });
          console.log('data', data);

          if (error) {
            console.error('Supabase RPC error:', error);
            return { result: `Error: Failed to query the database.` };
          }

          if (!data || data.length === 0) {
            return { result: `No agency found for "${agencyName}".` };
          }

          if (data.length === 1) {
            const item = data[0];
            return { result: `The agency code for ${item.agency_name} is ${item.agency_cd}.` };
          }

          const agencyList = data
            .map(
              (item: { agency_name: string; agency_cd: number }) =>
                `${item.agency_name} (Code: ${item.agency_cd})`,
            )
            .join(', ');

          return { result: `Found multiple possible agencies for "${agencyName}": ${agencyList}.` };
        } catch (e) {
          console.error('Error executing tool:', e);
          return { result: `An unexpected error occurred.` };
        }
      },
    });
    ```

2.  **Create a Tools Index File (Optional but Recommended):**
    - Create `lib/tools/index.ts` to centralize all tool exports for easier imports.

    ```typescript
    export { getAgencyCodeTool } from './databaseCodes';
    ```

3.  **Update the API Route:**
    - Simplify your `app/api/chat/route.ts` by importing the pre-defined tools.

    ```typescript
    import { openai } from '@ai-sdk/openai';
    import { streamText } from 'ai';
    import { getAgencyCodeTool } from '../../../lib/tools/databaseCodes';
    // Or if using the index file: import { getAgencyCodeTool } from '../../../lib/tools';

    export const maxDuration = 30;

    export async function POST(req: Request) {
      const { messages } = await req.json();

      const result = streamText({
        model: openai('gpt-4o'),
        system:
          'You are a helpful assistant. When a tool returns a result, you must report that result directly to the user without adding any extra information or commentary.',
        messages,
        tools: {
          getAgencyCode: getAgencyCodeTool,
          // Add other tools here as needed
        },
      });

      return result.toDataStreamResponse();
    }
    ```

4.  **Benefits of This Approach:**
    - **Separation of Concerns:** Business logic is separated from API routing
    - **Reusability:** Tools can be easily imported and used in other parts of your application
    - **Testability:** Individual tools can be unit tested in isolation
    - **Maintainability:** Tool-specific code is easier to find and modify
    - **Scalability:** As you add more tools, the API route remains clean and focused

### Step 5: Enhance the Frontend to Display Tool Usage

To provide a better user experience, you should update the frontend to clearly indicate when a tool is being used by the AI. This involves customizing the rendering of `tool-invocation` parts in your chat interface.

1.  **Modify `app/page.tsx` to Render Tool Calls:**

    Update the `switch` statement inside your `messages.map` function in `app/page.tsx`. Instead of just stringifying the `toolInvocation` object, you can render a formatted block that shows the tool name and the arguments it was called with.

    Here is the updated code for `app/page.tsx`:

    ```tsx
    'use client';

    import { useChat } from '@ai-sdk/react';

    export default function Chat() {
      const { messages, input, handleInputChange, handleSubmit } = useChat();
      return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
          {messages.map(message => (
            <div key={message.id} className="whitespace-pre-wrap my-2">
              <div className="font-bold">
                {message.role === 'user' ? 'User' : 'AI'}
              </div>
              <div className="ml-2">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return <div key={`${message.id}-${i}`}>{part.text}</div>;
                    case 'tool-invocation': {
                      const { toolName, args } = part.toolInvocation;
                      return (
                        <div key={`${message.id}-${i}`} className="text-sm text-zinc-500">
                          <div className="my-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                            <p className="font-semibold">Calling tool: {toolName}</p>
                            <pre className="text-xs mt-2 whitespace-pre-wrap">
                              {JSON.stringify(args, null, 2)}
                            </pre>
                          </div>
                        </div>
                      );
                    }
                  }
                })}
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit}>
            <input
              className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
              value={input}
              placeholder="Say something..."
              onChange={handleInputChange}
            />
          </form>
        </div>
      );
    }
    ```

2.  **Understanding the Flow:**

    With this change:
    - When the AI decides to use the `getAgencyCode` tool, a new message part will be rendered showing "Calling tool: getAgencyCode" along with the arguments (the `agencyName` you provided).
    - The Vercel AI SDK handles sending the tool result back to the LLM behind the scenes.
    - The LLM will then process the tool's output and generate a final, user-facing text response. This response will appear as a new, separate message from the AI, which is already handled by the `case 'text'`. This fulfills the requirement to "let the llm show the result".

This provides clear feedback to the user about the agent's actions.

### Step 6: Test Your Agent

You are now ready to test the new capability.

1.  Run your Next.js application.
2.  Open the chat interface.
3.  Ask the AI about an agency. For example:
    - "What is the agency code for Health and Human Services?"
    - "Can you find the code for the transportation agency?"
4.  The AI should now be able to use your new tool to look up the information in the database and provide a relevant answer.

---

## Step 7: Extend Tools for All Database Code Tables

To create a comprehensive lookup system, you should add tools for all the code tables in your database. This will allow users to search for any type of code or description across all lookup tables.

### 7.1: Create Database Functions for All Code Tables

Add these SQL functions to your Supabase database through the SQL Editor:

#### Application Fund Codes Function
```sql
CREATE OR REPLACE FUNCTION search_application_funds_case_insensitive(search_term TEXT)
RETURNS TABLE (
  appd_fund_num BIGINT,
  appd_fund_num_name TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Appd_Fund_Num",
    "Appd_Fund_Num_Name",
    similarity(LOWER("Appd_Fund_Num_Name"), LOWER(search_term))
  FROM
    "applicationFundCodes"
  WHERE
    similarity(LOWER("Appd_Fund_Num_Name"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

#### Appropriation Name Codes Function
```sql
CREATE OR REPLACE FUNCTION search_appropriations_case_insensitive(search_term TEXT)
RETURNS TABLE (
  appropriation_number TEXT,
  appropriation_name TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Appropriation_Number",
    "Appropriation_Name",
    similarity(LOWER("Appropriation_Name"), LOWER(search_term))
  FROM
    "appropriationNameCodes"
  WHERE
    similarity(LOWER("Appropriation_Name"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

#### Category Codes Function
```sql
CREATE OR REPLACE FUNCTION search_categories_case_insensitive(search_term TEXT)
RETURNS TABLE (
  catcode TEXT,
  category TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "CatCode",
    "Category",
    similarity(LOWER("Category"), LOWER(search_term))
  FROM
    "categoryCodes"
  WHERE
    similarity(LOWER("Category"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

#### Fund Codes Function
```sql
CREATE OR REPLACE FUNCTION search_funds_case_insensitive(search_term TEXT)
RETURNS TABLE (
  fund_num BIGINT,
  fund_description TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Fund_Num",
    "Fund_Description",
    similarity(LOWER("Fund_Description"), LOWER(search_term))
  FROM
    "fundCodes"
  WHERE
    similarity(LOWER("Fund_Description"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

#### Payee Codes Function
```sql
CREATE OR REPLACE FUNCTION search_payees_case_insensitive(search_term TEXT)
RETURNS TABLE (
  payee_id TEXT,
  payee_name TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Payee_id",
    "Payee_Name",
    similarity(LOWER("Payee_Name"), LOWER(search_term))
  FROM
    "payeeCodes"
  WHERE
    similarity(LOWER("Payee_Name"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

#### Comptroller Codes Function
```sql
CREATE OR REPLACE FUNCTION search_comptroller_case_insensitive(search_term TEXT)
RETURNS TABLE (
  comptroller_object_num BIGINT,
  comptroller_object_name TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Comptroller_Object_Num",
    "Comptroller_Object_Name",
    similarity(LOWER("Comptroller_Object_Name"), LOWER(search_term))
  FROM
    "comptrollerCodes"
  WHERE
    similarity(LOWER("Comptroller_Object_Name"), LOWER(search_term)) > 0.2
  ORDER BY
    similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### 7.2: Create RLS Policies for All Tables

Ensure all tables have proper read access by creating RLS policies:

```sql
-- Application Fund Codes
CREATE POLICY "Allow public read access" ON "applicationFundCodes" FOR SELECT TO public USING (true);

-- Appropriation Name Codes  
CREATE POLICY "Allow public read access" ON "appropriationNameCodes" FOR SELECT TO public USING (true);

-- Category Codes
CREATE POLICY "Allow public read access" ON "categoryCodes" FOR SELECT TO public USING (true);

-- Fund Codes
CREATE POLICY "Allow public read access" ON "fundCodes" FOR SELECT TO public USING (true);

-- Payee Codes
CREATE POLICY "Allow public read access" ON "payeeCodes" FOR SELECT TO public USING (true);

-- Comptroller Codes
CREATE POLICY "Allow public read access" ON "comptrollerCodes" FOR SELECT TO public USING (true);
```

### 7.3: Expand the Database Tools File

Update your `lib/tools/databaseCodes.ts` file to include all the new tools:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { supabase } from '../supabase';

// Existing Agency Code Tool
export const getAgencyCodeTool = tool({
  description: 'Get the agency code for an agency name. Uses fuzzy search to return agencies from the database with fuzzy search.',
  parameters: z.object({
    agencyName: z.string().describe('The name of the agency to search for.'),
  }),
  execute: async ({ agencyName }) => {
    try {
      console.log('search_term', agencyName);
      const { data, error } = await supabase.rpc('search_agencies_case_insensitive', {
        search_term: agencyName,
      });
      console.log('data', data);

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No agency found for "${agencyName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The agency code for ${item.agency_name} is ${item.agency_cd}.` };
      }

      const agencyList = data
        .map(
          (item: { agency_name: string; agency_cd: number }) =>
            `${item.agency_name} (Code: ${item.agency_cd})`,
        )
        .join(', ');

      return { result: `Found multiple possible agencies for "${agencyName}": ${agencyList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Application Fund Code Tool
export const getApplicationFundCodeTool = tool({
  description: 'Get the application fund code for a fund name. Uses fuzzy search to return application funds from the database.',
  parameters: z.object({
    fundName: z.string().describe('The name of the application fund to search for.'),
  }),
  execute: async ({ fundName }) => {
    try {
      const { data, error } = await supabase.rpc('search_application_funds_case_insensitive', {
        search_term: fundName,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No application fund found for "${fundName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The application fund code for ${item.appd_fund_num_name} is ${item.appd_fund_num}.` };
      }

      const fundList = data
        .map(
          (item: { appd_fund_num_name: string; appd_fund_num: number }) =>
            `${item.appd_fund_num_name} (Code: ${item.appd_fund_num})`,
        )
        .join(', ');

      return { result: `Found multiple possible application funds for "${fundName}": ${fundList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Appropriation Code Tool
export const getAppropriationCodeTool = tool({
  description: 'Get the appropriation number for an appropriation name. Uses fuzzy search to return appropriations from the database.',
  parameters: z.object({
    appropriationName: z.string().describe('The name of the appropriation to search for.'),
  }),
  execute: async ({ appropriationName }) => {
    try {
      const { data, error } = await supabase.rpc('search_appropriations_case_insensitive', {
        search_term: appropriationName,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No appropriation found for "${appropriationName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The appropriation number for ${item.appropriation_name} is ${item.appropriation_number}.` };
      }

      const appropriationList = data
        .map(
          (item: { appropriation_name: string; appropriation_number: string }) =>
            `${item.appropriation_name} (Number: ${item.appropriation_number})`,
        )
        .join(', ');

      return { result: `Found multiple possible appropriations for "${appropriationName}": ${appropriationList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Category Code Tool
export const getCategoryCodeTool = tool({
  description: 'Get the category code for a category name. Uses fuzzy search to return categories from the database.',
  parameters: z.object({
    categoryName: z.string().describe('The name of the category to search for.'),
  }),
  execute: async ({ categoryName }) => {
    try {
      const { data, error } = await supabase.rpc('search_categories_case_insensitive', {
        search_term: categoryName,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No category found for "${categoryName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The category code for ${item.category} is ${item.catcode}.` };
      }

      const categoryList = data
        .map(
          (item: { category: string; catcode: string }) =>
            `${item.category} (Code: ${item.catcode})`,
        )
        .join(', ');

      return { result: `Found multiple possible categories for "${categoryName}": ${categoryList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Fund Code Tool
export const getFundCodeTool = tool({
  description: 'Get the fund number for a fund description. Uses fuzzy search to return funds from the database.',
  parameters: z.object({
    fundDescription: z.string().describe('The description of the fund to search for.'),
  }),
  execute: async ({ fundDescription }) => {
    try {
      const { data, error } = await supabase.rpc('search_funds_case_insensitive', {
        search_term: fundDescription,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No fund found for "${fundDescription}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The fund number for ${item.fund_description} is ${item.fund_num}.` };
      }

      const fundList = data
        .map(
          (item: { fund_description: string; fund_num: number }) =>
            `${item.fund_description} (Number: ${item.fund_num})`,
        )
        .join(', ');

      return { result: `Found multiple possible funds for "${fundDescription}": ${fundList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Payee Code Tool
export const getPayeeCodeTool = tool({
  description: 'Get the payee ID for a payee name. Uses fuzzy search to return payees from the database.',
  parameters: z.object({
    payeeName: z.string().describe('The name of the payee to search for.'),
  }),
  execute: async ({ payeeName }) => {
    try {
      const { data, error } = await supabase.rpc('search_payees_case_insensitive', {
        search_term: payeeName,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No payee found for "${payeeName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The payee ID for ${item.payee_name} is ${item.payee_id}.` };
      }

      const payeeList = data
        .map(
          (item: { payee_name: string; payee_id: string }) =>
            `${item.payee_name} (ID: ${item.payee_id})`,
        )
        .join(', ');

      return { result: `Found multiple possible payees for "${payeeName}": ${payeeList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Comptroller Code Tool
export const getComptrollerCodeTool = tool({
  description: 'Get the comptroller object number for a comptroller object name. Uses fuzzy search to return comptroller objects from the database.',
  parameters: z.object({
    comptrollerObjectName: z.string().describe('The name of the comptroller object to search for.'),
  }),
  execute: async ({ comptrollerObjectName }) => {
    try {
      const { data, error } = await supabase.rpc('search_comptroller_case_insensitive', {
        search_term: comptrollerObjectName,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No comptroller object found for "${comptrollerObjectName}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The comptroller object number for ${item.comptroller_object_name} is ${item.comptroller_object_num}.` };
      }

      const comptrollerList = data
        .map(
          (item: { comptroller_object_name: string; comptroller_object_num: number }) =>
            `${item.comptroller_object_name} (Number: ${item.comptroller_object_num})`,
        )
        .join(', ');

      return { result: `Found multiple possible comptroller objects for "${comptrollerObjectName}": ${comptrollerList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});
```

### 7.4: Update the API Route

Update your `app/api/chat/route.ts` to include all the new tools:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import {
  getAgencyCodeTool,
  getApplicationFundCodeTool,
  getAppropriationCodeTool,
  getCategoryCodeTool,
  getFundCodeTool,
  getPayeeCodeTool,
  getComptrollerCodeTool,
} from '../../../lib/tools/databaseCodes';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system:
      'You are a helpful assistant that can look up various Texas government codes and information. When a tool returns a result, you must report that result directly to the user without adding any extra information or commentary.',
    messages,
    tools: {
      getAgencyCode: getAgencyCodeTool,
      getApplicationFundCode: getApplicationFundCodeTool,
      getAppropriationCode: getAppropriationCodeTool,
      getCategoryCode: getCategoryCodeTool,
      getFundCode: getFundCodeTool,
      getPayeeCode: getPayeeCodeTool,
      getComptrollerCode: getComptrollerCodeTool,
    },
  });

  return result.toDataStreamResponse();
}
```

### 7.5: Test All Code Lookup Capabilities

After implementing all tools, test the comprehensive lookup system:

1. **Agency Codes**: "What is the agency code for Health and Human Services?"
2. **Application Fund Codes**: "Find the application fund code for tobacco settlement"
3. **Appropriation Codes**: "What is the appropriation number for dental services?"
4. **Category Codes**: "Find the category code for public assistance payments"
5. **Fund Codes**: "What is the fund number for tobacco settlement?"
6. **Payee Codes**: "Find the payee ID for DentaQuest"
7. **Comptroller Codes**: "What is the comptroller object number for supplementary medical insurance benefits?"

This comprehensive setup will allow your AI agent to help users find any type of code or ID across all the lookup tables in your Texas government database.
