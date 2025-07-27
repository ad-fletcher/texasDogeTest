/**
 * Enhanced SQL Analytics Tools for Texas DOGE Database
 * 
 * This extends the existing databaseCodes.ts with advanced SQL generation
 * capabilities that use natural language entity resolution and the AI SDK.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { DATABASE_SCHEMA_CONTEXT, BUSINESS_CONTEXT } from '../database/schema-context';
import { supabase } from '../supabase';

/**
 * Schema for SQL Query Generation Results
 */
export const sqlQueryResultSchema = z.object({
  query: z.string().describe('The generated PostgreSQL query with proper syntax'),
  explanation: z.string().describe('Plain English explanation of what the query does'),
  isValid: z.boolean().describe('Whether the query passes basic validation'),
  estimatedRows: z.number().describe('Estimated number of rows the query will return'),
  chartSuitable: z.boolean().describe('Whether the results are suitable for chart visualization'),
  temporalAnalysis: z.boolean().describe('Whether this query involves time-based analysis'),
  complexity: z.enum(['Simple', 'Moderate', 'Complex']).describe('Query complexity level'),
  queryType: z.enum(['topN', 'trends', 'comparison', 'breakdown', 'detailed']).describe('Type of analysis being performed'),
  suggestedChartType: z.enum(['bar', 'line', 'area', 'pie']).describe('Recommended chart type for visualization')
});

export type SQLQueryResult = z.infer<typeof sqlQueryResultSchema>;

/**
 * Schema for Resolved Entities
 */
export const resolvedEntitiesSchema = z.object({
  agencies: z.array(z.object({
    name: z.string(),
    code: z.number()
  })).optional().describe('Resolved agency names and codes'),
  categories: z.array(z.object({
    name: z.string(),
    code: z.number()
  })).optional().describe('Resolved category names and codes'),
  payees: z.array(z.object({
    name: z.string(),
    id: z.number()
  })).optional().describe('Resolved payee names and IDs'),
  funds: z.array(z.object({
    name: z.string(),
    number: z.number()
  })).optional().describe('Resolved fund names and numbers'),
  applicationFunds: z.array(z.object({
    name: z.string(),
    number: z.number()
  })).optional().describe('Resolved application fund names and numbers'),
  appropriations: z.array(z.object({
    name: z.string(),
    number: z.number()
  })).optional().describe('Resolved appropriation names and numbers'),
  comptrollerCodes: z.array(z.object({
    name: z.string(),
    number: z.number()
  })).optional().describe('Resolved comptroller object names and numbers'),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
    granularity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional()
  }).optional().describe('Resolved date range and temporal granularity')
});

export type ResolvedEntities = z.infer<typeof resolvedEntitiesSchema>;

/**
 * Main Enhanced SQL Generation Tool
 * 
 * This tool generates SQL queries from natural language with entity resolution
 * and leverages the optimized database schema with clean integer joins.
 */
export const generateAnalyticsQueryTool = tool({
  description: 'Generate SQL queries for Texas DOGE database with natural language entity resolution and business context',
  parameters: z.object({
    naturalLanguageQuery: z.string().describe('The natural language question about Texas government spending data'),
    resolvedEntities: resolvedEntitiesSchema.optional().describe('Pre-resolved entities from entity resolution workflow'),
    conversationContext: z.array(z.string()).optional().describe('Previous queries in the conversation for context')
  }),
  execute: async ({ naturalLanguageQuery, resolvedEntities, conversationContext = [] }) => {
    try {
      // Construct enhanced prompt with resolved entities and context
      const entityContext = resolvedEntities ? `
RESOLVED ENTITIES:
${resolvedEntities.agencies ? `Agencies: ${resolvedEntities.agencies.map(a => `${a.name} (${a.code})`).join(', ')}` : ''}
${resolvedEntities.categories ? `Categories: ${resolvedEntities.categories.map(c => `${c.name} (${c.code})`).join(', ')}` : ''}
${resolvedEntities.payees ? `Payees: ${resolvedEntities.payees.map(p => `${p.name} (${p.id})`).join(', ')}` : ''}
${resolvedEntities.funds ? `Funds: ${resolvedEntities.funds.map(f => `${f.name} (${f.number})`).join(', ')}` : ''}
${resolvedEntities.applicationFunds ? `Application Funds: ${resolvedEntities.applicationFunds.map(af => `${af.name} (${af.number})`).join(', ')}` : ''}
${resolvedEntities.appropriations ? `Appropriations: ${resolvedEntities.appropriations.map(a => `${a.name} (${a.number})`).join(', ')}` : ''}
${resolvedEntities.comptrollerCodes ? `Comptroller Codes: ${resolvedEntities.comptrollerCodes.map(cc => `${cc.name} (${cc.number})`).join(', ')}` : ''}
${resolvedEntities.dateRange ? `Date Range: ${resolvedEntities.dateRange.start} to ${resolvedEntities.dateRange.end}` : ''}
      ` : '';

      const conversationContextStr = conversationContext.length > 0 ? `
CONVERSATION CONTEXT:
Previous queries: ${conversationContext.join('; ')}
      ` : '';

      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `${DATABASE_SCHEMA_CONTEXT}

${BUSINESS_CONTEXT}

ADVANCED SQL GENERATION GUIDELINES:
1. Use the optimized schema with clean integer joins (no type casting needed)
2. Always convert amounts from cents to dollars for display: p."Amount" / 100.0
3. Include meaningful column aliases for chart-friendly output
4. Use appropriate aggregation functions (SUM, COUNT, AVG)
5. Include proper WHERE clauses for date filtering (2022 data only)
6. Optimize for visualization with reasonable row counts (10-100 rows)
7. Use proper temporal analysis with DATE_TRUNC functions
8. Leverage resolved entities to improve query accuracy
9. Consider query complexity and suggest appropriate chart types
10. Ensure all identifiers are properly quoted

QUERY OPTIMIZATION PATTERNS:
- Top N Analysis: Use ORDER BY ... DESC LIMIT N
- Temporal Trends: Use DATE_TRUNC with GROUP BY and ORDER BY date
- Comparisons: Use multiple JOINs and GROUP BY
- Breakdowns: Use aggregation with percentage calculations
- Detailed Analysis: Use complex JOINs with specific filtering`,

        prompt: `Generate an optimized PostgreSQL query for this request:

NATURAL LANGUAGE QUERY: ${naturalLanguageQuery}

${entityContext}

${conversationContextStr}

Requirements:
- Use clean integer joins (no type casting needed)
- Convert amounts to dollars for display
- Include chart-friendly column names
- Optimize for the specific type of analysis requested
- Use 2022 date constraints where applicable
- Return reasonable number of rows for visualization`,

        schema: sqlQueryResultSchema
      });

      return result.object;

    } catch (error) {
      console.error('Error generating SQL query:', error);
      return {
        query: '',
        explanation: 'Failed to generate SQL query due to an error',
        isValid: false,
        estimatedRows: 0,
        chartSuitable: false,
        temporalAnalysis: false,
        complexity: 'Simple' as const,
        queryType: 'detailed' as const,
        suggestedChartType: 'bar' as const,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
});

/**
 * Utility functions for entity resolution using direct Supabase calls
 */
const searchAgencies = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_agencies_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchCategories = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_categories_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchPayees = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_payees_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchApplicationFunds = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_application_funds_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchAppropriations = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_appropriations_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchFunds = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_funds_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

const searchComptrollerCodes = async (searchTerm: string) => {
  const { data, error } = await supabase.rpc('search_comptroller_case_insensitive', {
    search_term: searchTerm,
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0]; // Return first match
};

/**
 * Entity Resolution Workflow
 * 
 * Pre-processes natural language to resolve entity names using direct database calls
 * This improves SQL generation accuracy by providing specific codes and names.
 */
export const resolveEntitiesWorkflow = async (query: string): Promise<ResolvedEntities> => {
  const entities: ResolvedEntities = {};
  const queryLower = query.toLowerCase();

  try {
    // Resolve agencies
    if (queryLower.includes('agency') || queryLower.includes('department') || queryLower.includes('commission')) {
      const agencyKeywords = [
        'health', 'human services', 'transportation', 'education', 'public safety',
        'military', 'parks', 'wildlife', 'senate', 'house', 'retirement'
      ];
      
      for (const keyword of agencyKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchAgencies(keyword);
            if (result) {
              if (!entities.agencies) entities.agencies = [];
              entities.agencies.push({
                name: result.agency_name,
                code: result.agency_cd
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve agency for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve categories
    if (queryLower.includes('category') || queryLower.includes('spending type') || 
        queryLower.includes('salaries') || queryLower.includes('benefits') || 
        queryLower.includes('assistance') || queryLower.includes('outlay')) {
      
      const categoryKeywords = [
        'salary', 'wage', 'benefit', 'assistance', 'outlay', 'capital',
        'intergovernmental', 'expenditure', 'transfer'
      ];
      
      for (const keyword of categoryKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchCategories(keyword);
            if (result) {
              if (!entities.categories) entities.categories = [];
              entities.categories.push({
                name: result.category,
                code: parseInt(result.catcode)
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve category for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve payees (if specific payee names are mentioned)
    if (queryLower.includes('payee') || queryLower.includes('contractor') || queryLower.includes('vendor')) {
      const payeeKeywords = ['bank', 'hospital', 'university', 'district', 'system', 'services'];
      
      for (const keyword of payeeKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchPayees(keyword);
            if (result) {
              if (!entities.payees) entities.payees = [];
              entities.payees.push({
                name: result.payee_name,
                id: parseInt(result.payee_id)
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve payee for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve application funds
    if (queryLower.includes('application fund') || queryLower.includes('fund') || 
        queryLower.includes('revenue') || queryLower.includes('highway') || 
        queryLower.includes('school fund') || queryLower.includes('technology')) {
      
      const applicationFundKeywords = [
        'revenue', 'highway', 'school', 'technology', 'debt service', 'general',
        'available', 'instructional', 'materials'
      ];
      
      for (const keyword of applicationFundKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchApplicationFunds(keyword);
            if (result) {
              if (!entities.applicationFunds) entities.applicationFunds = [];
              entities.applicationFunds.push({
                name: result.appd_fund_num_name,
                number: result.appd_fund_num
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve application fund for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve appropriations
    if (queryLower.includes('appropriation') || queryLower.includes('unappropriated') || 
        queryLower.includes('oasi') || queryLower.includes('match')) {
      
      const appropriationKeywords = [
        'unappropriated', 'oasi', 'match', 'activity', 'receipts', 'exempt',
        'bond', 'debt', 'service'
      ];
      
      for (const keyword of appropriationKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchAppropriations(keyword);
            if (result) {
              if (!entities.appropriations) entities.appropriations = [];
              entities.appropriations.push({
                name: result.appropriation_name,
                number: result.appropriation_number
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve appropriation for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve fund codes (general fund descriptions)
    if (queryLower.includes('fund') && !queryLower.includes('application fund')) {
      const fundKeywords = [
        'general', 'revenue', 'capital', 'debt', 'operations', 'bond',
        'highway', 'education', 'special'
      ];
      
      for (const keyword of fundKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchFunds(keyword);
            if (result) {
              if (!entities.funds) entities.funds = [];
              entities.funds.push({
                name: result.fund_description,
                number: result.fund_num
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve fund for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve comptroller codes (object codes)
    if (queryLower.includes('object') || queryLower.includes('comptroller') || 
        queryLower.includes('line item') || queryLower.includes('classified') || 
        queryLower.includes('exempt') || queryLower.includes('permanent') || 
        queryLower.includes('non-permanent') || queryLower.includes('full-time') || 
        queryLower.includes('part-time')) {
      
      const comptrollerKeywords = [
        'salary', 'wage', 'line item', 'exempt', 'classified', 'non-classified',
        'permanent', 'non-permanent', 'full-time', 'part-time', 'employee'
      ];
      
      for (const keyword of comptrollerKeywords) {
        if (queryLower.includes(keyword)) {
          try {
            const result = await searchComptrollerCodes(keyword);
            if (result) {
              if (!entities.comptrollerCodes) entities.comptrollerCodes = [];
              entities.comptrollerCodes.push({
                name: result.comptroller_object_name,
                number: result.comptroller_object_num
              });
            }
          } catch (e) {
            console.warn(`Failed to resolve comptroller code for keyword: ${keyword}`, e);
          }
        }
      }
    }

    // Resolve date ranges
    if (queryLower.includes('month') || queryLower.includes('quarter') || 
        queryLower.includes('2022') || queryLower.includes('year')) {
      
      // Default to 2022 full year
      entities.dateRange = {
        start: '2022-01-01',
        end: '2022-12-31'
      };

      // Determine granularity
      if (queryLower.includes('daily')) {
        entities.dateRange.granularity = 'daily';
      } else if (queryLower.includes('weekly')) {
        entities.dateRange.granularity = 'weekly';
      } else if (queryLower.includes('month')) {
        entities.dateRange.granularity = 'monthly';
      } else if (queryLower.includes('quarter')) {
        entities.dateRange.granularity = 'quarterly';
      } else if (queryLower.includes('year')) {
        entities.dateRange.granularity = 'yearly';
      }

      // Parse specific months or quarters if mentioned
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      for (let i = 0; i < monthNames.length; i++) {
        if (queryLower.includes(monthNames[i])) {
          const month = (i + 1).toString().padStart(2, '0');
          entities.dateRange.start = `2022-${month}-01`;
          entities.dateRange.end = `2022-${month}-${new Date(2022, i + 1, 0).getDate()}`;
          entities.dateRange.granularity = 'monthly';
          break;
        }
      }

      // Parse quarters
      if (queryLower.includes('q1')) {
        entities.dateRange.start = '2022-01-01';
        entities.dateRange.end = '2022-03-31';
        entities.dateRange.granularity = 'quarterly';
      } else if (queryLower.includes('q2')) {
        entities.dateRange.start = '2022-04-01';
        entities.dateRange.end = '2022-06-30';
        entities.dateRange.granularity = 'quarterly';
      } else if (queryLower.includes('q3')) {
        entities.dateRange.start = '2022-07-01';
        entities.dateRange.end = '2022-09-30';
        entities.dateRange.granularity = 'quarterly';
      } else if (queryLower.includes('q4')) {
        entities.dateRange.start = '2022-10-01';
        entities.dateRange.end = '2022-12-31';
        entities.dateRange.granularity = 'quarterly';
      }
    }

  } catch (error) {
    console.error('Error in entity resolution workflow:', error);
  }

  return entities;
};

/**
 * Query Enhancement Helper
 * 
 * Takes a basic query and enhances it with better joins, aggregations, and formatting
 */
export const enhanceQueryForVisualization = (baseQuery: string, queryType: string): string => {
  let enhancedQuery = baseQuery;

  // Add amount conversion if not present
  if (enhancedQuery.includes('"Amount"') && !enhancedQuery.includes('/ 100.0')) {
    enhancedQuery = enhancedQuery.replace(
      /SUM\(p\."Amount"\)/g, 
      'SUM(p."Amount") / 100.0'
    );
    enhancedQuery = enhancedQuery.replace(
      /AVG\(p\."Amount"\)/g, 
      'AVG(p."Amount") / 100.0'
    );
  }

  // Add proper aliases for chart-friendly output
  if (!enhancedQuery.includes(' as ') && !enhancedQuery.includes(' AS ')) {
    if (queryType === 'topN' || queryType === 'breakdown') {
      enhancedQuery = enhancedQuery.replace(
        'SUM(p."Amount") / 100.0',
        'SUM(p."Amount") / 100.0 as total_dollars'
      );
      enhancedQuery = enhancedQuery.replace(
        'COUNT(*)',
        'COUNT(*) as payment_count'
      );
    }
  }

  // Ensure reasonable LIMIT for visualization
  if (!enhancedQuery.includes('LIMIT') && queryType !== 'trends') {
    if (queryType === 'topN') {
      enhancedQuery += ' LIMIT 10';
    } else if (queryType === 'breakdown') {
      enhancedQuery += ' LIMIT 20';
    }
  }

  return enhancedQuery;
};

/**
 * All tools and utilities are exported above with their declarations
 */ 