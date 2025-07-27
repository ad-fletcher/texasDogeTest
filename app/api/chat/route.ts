import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import {
  // Existing entity lookup tools (keep unchanged)
  getAgencyCodeTool,
  getApplicationFundCodeTool,
  getAppropriationCodeTool,
  getCategoryCodeTool,
  getFundCodeTool,
  getPayeeCodeTool,
  getComptrollerCodeTool,
  
  // NEW: Enhanced SQL analytics tools
  generateAnalyticsQueryTool,
  executeAnalyticsQueryTool,
  explainSQLQueryTool,
  generateChartConfigTool,
} from '../../../lib/tools/databaseCodes';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are Texas DOGE Assistant, an expert in analyzing Texas government spending data.  You can also talk to the user.

CONVERSATIONAL ENTITY RESOLUTION WORKFLOW:
1. When users mention entities (agencies, categories, etc.), use lookup tools FIRST
2. If multiple matches found, present options and ask user to choose
3. Once entities are resolved, use generateAnalyticsQuery with exact IDs
4. Execute queries and provide visualizations
5. Explain results in business context

SMART CONFIRMATION LOGIC:
- Single exact match: Auto-proceed with entity
- Multiple matches: Show options, ask user to choose  
- No matches: Suggest alternatives using fuzzy search
- Ambiguous queries: Ask clarifying questions

EXAMPLES:
User: "Show health spending"
You: "I found these health-related agencies: [list]. Which would you like to analyze?"

User: "Education trends over time" 
You: [Use getAgencyCode("education"), present options, then generate time series query]

Always be conversational and explain your reasoning.`,
    messages,
    tools: {
      // Entity lookup tools (unchanged - working perfectly)
      getAgencyCode: getAgencyCodeTool,
      getApplicationFundCode: getApplicationFundCodeTool,
      getAppropriationCode: getAppropriationCodeTool,
      getCategoryCode: getCategoryCodeTool,
      getFundCode: getFundCodeTool,
      getPayeeCode: getPayeeCodeTool,
      getComptrollerCode: getComptrollerCodeTool,
      
      // Enhanced SQL analytics tools (testing fixes)
      generateAnalyticsQuery: generateAnalyticsQueryTool,
      executeQuery: executeAnalyticsQueryTool,
      explainQuery: explainSQLQueryTool, // 🧪 testing fix
      // generateChart: generateChartConfigTool, // ❌ CAUSING ERROR - needs debugging
    },
    maxSteps: 15, // Allow complex multi-step workflows
  });

  return result.toDataStreamResponse();
}