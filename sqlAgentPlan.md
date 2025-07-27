# AI SQL Agent Implementation Plan

This document outlines a step-by-step plan to create an AI agent capable of performing data analysis on the `payments` database table. The agent will use a multi-step process involving entity recognition, user confirmation, SQL query generation, and data visualization, all orchestrated using the Vercel AI SDK.

### Core Concepts & Best Practices

This plan is based on the following modern Vercel AI SDK features:

1.  **`streamUI` (Generative UI):** Instead of just streaming text, the AI will generate and stream React components to the client. This is perfect for the user confirmation step and for displaying the final data table and chart. This avoids complex client-side state management.
2.  **RSC (React Server Components):** The UI generation will happen on the server, keeping the client light and responsive.
3.  **Tool-Based Architecture:** We will extend the existing toolset. The first set of tools will find potential IDs, and a new, powerful tool will be created to query the main `payments` table and return structured data.

---

### Step 1: Backend - Modify the API Route for Orchestration

The main orchestration logic will live in `app/api/chat/route.ts`. We will refactor it to use `streamUI` instead of `streamText`.

**File:** `app/api/chat/route.ts`

1.  **Import `streamUI`:** Replace `streamText` with `streamUI` from `ai/rsc`.
2.  **Update Model:** We will use a powerful model like GPT-4o, which is good at reasoning and tool use.
3.  **Orchestration Logic:**
    *   The `streamUI` call will manage the conversation flow.
    *   The system prompt will be updated to define the two-stage process:
        1.  **Clarification Stage:** First, use the existing `get...CodeTool` tools to find potential IDs for agencies, funds, etc., based on the user's query.
        2.  **Analysis Stage:** After the user confirms the IDs, use a new `analyzePayments` tool to query the database.
    *   The agent will first call the lookup tools. Based on the results, it will render a `<ConfirmationComponent />` and stream it to the user.
    *   When the user submits the confirmation form, a new request is sent. The agent will then have the confirmed IDs and will call the `analyzePayments` tool.
    *   Finally, the agent will receive the data from the `analyzePayments` tool and stream the final UI, containing a `<ResultTable />` and `<ResultChart />`.

---

### Step 2: Backend - Create the SQL Analysis Tool

We need a new tool that can take the confirmed entity codes, build a SQL query, and fetch data from the `payments` table.

**New File:** `lib/tools/sqlAnalysis.ts`

1.  **Define `analyzePayments` Tool:**
    *   This tool will accept parameters like `agency_cd`, `fund_num`, `payee_id`, etc.
    *   It will dynamically construct a `SELECT` query against the `payments` table with a `WHERE` clause based on the provided parameters.
    *   It will use the Supabase client to execute the raw SQL query.
    *   The tool will return the query results as a JSON object (an array of payment rows).
    *   **Security:** Ensure the tool properly sanitizes inputs to prevent SQL injection, although using the Supabase client with parameterized queries is generally safe.

2.  **Integrate the New Tool:**
    *   Import and add the `analyzePayments` tool to the `tools` object in the `app/api/chat/route.ts` API route.

---

### Step 3: Frontend - Build the User Confirmation UI

Create a new React component that the AI can render when it needs the user to confirm its findings.

**New File:** `components/confirmation-form.tsx`

1.  **Component Structure:**
    *   This will be a client component (`'use client'`).
    *   It will receive the list of potential entities (e.g., `{ type: 'Agency', name: 'Health and Human Services', id: 529 }`) as props.
    *   It will display these entities, perhaps with checkboxes or dropdowns, allowing the user to confirm, deselect, or change them.
    *   It will have a "Confirm" or "Analyze" button.
    *   On submit, it will send the confirmed selections back to the AI agent. This can be done by appending a message to the chat and re-submitting the form via the `useChat` hook.

---

### Step 4: Frontend - Update the Main Chat Interface

The main chat page needs to be able to render the UI components streamed from the server.

**File:** `app/analyst/page.tsx`

1.  **Handle UI Components in Messages:**
    *   The `messages.map` loop will be updated. The Vercel AI SDK attaches a `ui` property to messages when using `streamUI`.
    *   We will add a new case in our `switch (part.type)` or message rendering logic to check for and render `part.ui` if it exists.

2.  **Displaying Tables and Charts:**
    *   We will create two new components, `<ResultTable />` and `<ResultChart />`, that take the data from the `analyzePayments` tool as props.
    *   The AI will render these components in its final message.
    *   `<ResultTable />` will use the existing `components/ui/table.tsx`.
    *   `<ResultChart />` will use the existing `components/ui/chart.tsx`. We will need to inspect the chart component to see which library it uses (e.g., Recharts, Chart.js) and what data format it expects. We may need to add a charting library dependency if one isn't already present.

---

### Step 5: Project Dependencies

1.  **Charting Library:** Check `package.json` and `components/ui/chart.tsx`. If a charting library is not already installed, we will need to add one. `recharts` is a popular and easy-to-use choice.
    ```bash
    pnpm add recharts
    ```

This plan creates a robust, interactive, and user-friendly data analysis agent that follows the latest best practices for the Vercel AI SDK.
