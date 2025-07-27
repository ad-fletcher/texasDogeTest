import { tool } from 'ai';
    import { z } from 'zod';
    import { generateObject } from 'ai';
    import { openai } from '@ai-sdk/openai';
    import { supabase } from '../supabase';
    import { DATABASE_SCHEMA_CONTEXT } from '../database/schema-context';

    // ========================================
    // EXISTING DATABASE CODE LOOKUP TOOLS
    // ========================================

    export const getAgencyCodeTool = tool({
      description: 'Get the agency code for an agency name. Uses fuzzy search to return agencies from the database with fuzzy search.',
      parameters: z.object({
        searchTerm: z.string().describe('The name of the agency to search for.'),
      }),
      execute: async ({ searchTerm }) => {
        try {
          console.log('search_term', searchTerm);
          const { data, error } = await supabase.rpc('search_agencies_case_insensitive', {
            search_term: searchTerm,
          });
          console.log('data', data);

          if (error) {
            console.error('Supabase RPC error:', error);
            return { result: `Error: Failed to query the database.` };
          }

          if (!data || data.length === 0) {
            return { result: `No agency found for "${searchTerm}".` };
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

          return { result: `Found multiple possible agencies for "${searchTerm}": ${agencyList}.` };
        } catch (e) {
          console.error('Error executing tool:', e);
          return { result: `An unexpected error occurred.` };
        }
      },
    });


    export const getApplicationFundCodeTool = tool({
      description: 'Get the application fund code for a fund name. Uses fuzzy search to return application funds from the database.',
      parameters: z.object({
        searchTerm: z.string().describe('The name of the application fund to search for.'),
      }),
      execute: async ({ searchTerm }) => {
        try {
          const { data, error } = await supabase.rpc('search_application_funds_case_insensitive', {
            search_term: searchTerm,
          });
    
          if (error) {
            console.error('Supabase RPC error:', error);
            return { result: `Error: Failed to query the database.` };
          }
    
          if (!data || data.length === 0) {
            return { result: `No application fund found for "${searchTerm}".` };
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
    
          return { result: `Found multiple possible application funds for "${searchTerm}": ${fundList}.` };
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
    searchTerm: z.string().describe('The name of the appropriation to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_appropriations_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No appropriation found for "${searchTerm}".` };
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

      return { result: `Found multiple possible appropriations for "${searchTerm}": ${appropriationList}.` };
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
    searchTerm: z.string().describe('The name of the category to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_categories_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No category found for "${searchTerm}".` };
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

      return { result: `Found multiple possible categories for "${searchTerm}": ${categoryList}.` };
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
    searchTerm: z.string().describe('The description of the fund to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_funds_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No fund found for "${searchTerm}".` };
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

      return { result: `Found multiple possible funds for "${searchTerm}": ${fundList}.` };
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
    searchTerm: z.string().describe('The name of the payee to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_payees_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No payee found for "${searchTerm}".` };
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

      return { result: `Found multiple possible payees for "${searchTerm}": ${payeeList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
})    




// Comptroller Code Tool
export const getComptrollerCodeTool = tool({
  description: 'Get the comptroller object number for a comptroller object name. Uses fuzzy search to return comptroller objects from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the comptroller object to search for.'),
    
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_comptroller_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No comptroller object found for "${searchTerm}".` };
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

      return { result: `Found multiple possible comptroller objects for "${searchTerm}": ${comptrollerList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// ========================================
// NEW SQL GENERATION TOOLS (Step 1.2)
// ========================================

// Enhanced SQL Analytics Query Generation Tool
export const generateAnalyticsQueryTool = tool({
  description: 'Generate PostgreSQL queries using pre-resolved entity IDs from lookup tools',
  parameters: z.object({
    naturalLanguageQuery: z.string(),
    resolvedEntities: z.object({
      agencyIds: z.array(z.number()).optional(),
      categoryIds: z.array(z.number()).optional(),
      fundIds: z.array(z.number()).optional(),
      payeeIds: z.array(z.number()).optional(),
      appropriationIds: z.array(z.number()).optional(),
      comptrollerIds: z.array(z.number()).optional(),
      applicationFundIds: z.array(z.number()).optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional()
    }).optional()
  }),
  execute: async ({ naturalLanguageQuery, resolvedEntities }) => {
    try {
      // Use AI SDK generateObject with schema context
      const result = await generateObject({
        model: openai('gpt-4.1'),
        system: DATABASE_SCHEMA_CONTEXT + `
        
        ENTITY RESOLUTION INTEGRATION:
        - Use provided entity IDs directly in WHERE clauses
        - No fuzzy matching needed - entities already resolved
        - Generate precise queries with exact ID matching
        
        EXAMPLES WITH RESOLVED ENTITIES:
        - agencyIds: [529, 537] → WHERE p."Agency_CD" IN (529, 537)
        - categoryIds: [5] → WHERE p."CatCode" = 5
        - dateRange specified → WHERE p."date" BETWEEN 'start' AND 'end'`,
        
        prompt: `Generate optimized PostgreSQL query for: "${naturalLanguageQuery}"
        
        Resolved Entities: ${JSON.stringify(resolvedEntities || {}, null, 2)}
        
        Use exact entity IDs in WHERE clauses for precision.`,
        
        schema: z.object({
          sqlQuery: z.string(),
          explanation: z.string(),
          isValid: z.boolean(),
          estimatedRows: z.number(),
          chartSuitable: z.boolean(),
          temporalAnalysis: z.boolean(),
          entityContext: z.string() // Explain which entities were used
        })
      });
      
      return result.object;
      
    } catch (e) {
      console.error('Error generating SQL query:', e);
      return {
        sqlQuery: '',
        isValid: false,
        explanation: 'Failed to generate SQL query',
        error: 'An error occurred while generating the SQL query',
        estimatedRows: 0,
        chartSuitable: false,
        temporalAnalysis: false,
        entityContext: ''
      };
    }
  },
});

// Enhanced Query Execution Tool
export const executeAnalyticsQueryTool = tool({
  description: 'Safely execute SQL queries against the Texas DOGE database',
  parameters: z.object({
    sqlQuery: z.string(),
    maxRows: z.number().default(1000)
  }),
  execute: async ({ sqlQuery, maxRows }) => {
    try {
      // Validate query safety (SELECT only, no modifications)
      if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
        return { error: 'Only SELECT queries are allowed', results: [] };
      }
      
      // The Supabase function now handles LIMIT clauses properly
      const { data, error } = await supabase.rpc('execute_analytics_query', {
        query_text: sqlQuery
      });
      
      if (error) {
        return { error: error.message, results: [] };
      }
      
      // Process results (convert cents to dollars, format dates)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedResults = data?.map((row: any) => ({
        ...row,
        // Convert amount fields from cents to dollars
        ...(row.amount && { amount: row.amount / 100 }),
        ...(row.total_amount && { total_amount: row.total_amount / 100 }),
        ...(row.monthly_spending && { monthly_spending: row.monthly_spending / 100 }),
        // Format dates consistently
        ...(row.date && { date: new Date(row.date).toISOString().split('T')[0] }),
        ...(row.month && { month: new Date(row.month).toISOString().split('T')[0] })
      })) || [];
      
      return { 
        results: processedResults,
        rowCount: processedResults.length,
        hasMoreResults: processedResults.length === maxRows
      };
      
    } catch (e) {
      console.error('Query execution error:', e);
      return { error: 'Query execution failed', results: [] };
    }
  }
});

// Enhanced SQL Query Explanation Tool
export const explainSQLQueryTool = tool({
  description: 'Explain SQL queries with business context for Texas DOGE database',
  parameters: z.object({
    sqlQuery: z.string(),
    originalQuestion: z.string(),
  }),
  execute: async ({ sqlQuery, originalQuestion }) => {
    try {
      const result = await generateObject({
        model: openai('gpt-4.1'),
        system: `${DATABASE_SCHEMA_CONTEXT}
        
        Explain SQL queries for Texas government spending analysis.
        Break down each section with business context and data insights.`,
        prompt: `Explain this SQL query in simple terms:
        
        Original Question: ${originalQuestion}
        SQL Query: ${sqlQuery}`,
        schema: z.object({
          sections: z.array(z.object({
            sqlSection: z.string(),
            explanation: z.string(),
            businessContext: z.string()
          })),
          summary: z.string(),
          dataInsights: z.array(z.string()),
          complexity: z.enum(['Simple', 'Moderate', 'Complex'])
        })
      });
      
      return result.object;
      
    } catch (e) {
      console.error('Error explaining SQL query:', e);
      return {
        sections: [],
        summary: 'Failed to explain the SQL query',
        dataInsights: [],
        complexity: 'Simple' as const,
        error: 'An error occurred while explaining the query'
      };
    }
  },
});

// Enhanced Chart Configuration Generation Tool
export const generateChartConfigTool = tool({
  description: 'Generate intelligent chart configurations with business insights, enhanced features, and alternative chart type suggestions',
  parameters: z.object({
    queryResultsJson: z.string().describe('JSON string of processed query results from executeAnalyticsQueryTool'),
    originalQuestion: z.string(),
    sqlQuery: z.string(),
    entityContext: z.string().optional()
  }),
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

      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `You are a data visualization expert for Texas government spending with expertise in enhanced chart features and multiple chart type recommendations.
        
        ENHANCED CHART TYPE SELECTION WITH ALTERNATIVES:
        - bar: Best for categorical comparisons (agencies, categories, funds)
          * Perfect for ranking and comparison analysis
          * Include rich contextual tooltips
        - line: Ideal for time series trends with zoom/brush capabilities
          * Show seasonal patterns and trend analysis
          * Enable zoom controls for detailed exploration
        - area: Cumulative analysis over time with interactive zoom
          * Best for showing growth patterns and total accumulation
        - pie: Composition analysis with detailed tooltips
          * Show percentage distributions effectively
          * Rich hover information
        
        ALTERNATIVE CHART GENERATION STRATEGY:
        - Always suggest 2-3 alternative chart types that would work well with the data
        - Rate each alternative's suitability on a scale of 1-10
        - Provide clear reasoning why each alternative would be valuable
        - Consider different analytical perspectives (comparison vs trends vs composition)
        - Ensure the primary recommendation is the best fit, alternatives offer different insights
        
        SUITABILITY SCORING GUIDELINES:
        - 9-10: Excellent fit, provides unique valuable insights
        - 7-8: Good fit, shows data from useful different perspective  
        - 5-6: Adequate fit, some value but not ideal
        - 3-4: Poor fit, limited analytical value
        - 1-2: Very poor fit, misleading or unhelpful
        
        BUSINESS CONTEXT INTEGRATION:
        - Reference specific Texas agencies and their roles
        - Provide actionable insights about government spending patterns
        - Highlight anomalies, trends, and fiscal efficiency opportunities
        - Consider Texas fiscal year context (Oct-Sep) and legislative cycles
        - Include contextual insights for major agencies:
          * Health and Human Services: Social services, healthcare, public assistance
          * Education: Universities, K-12, student aid, research
          * Transportation: Infrastructure, highways, public transit
          * Military: State guard, emergency response, homeland security
        
        ENHANCED FEATURES:
        - Generate insights that work well in hover tooltips
        - Create business context that helps users understand spending patterns
        - Suggest natural follow-up analyses based on the data pattern
        - Focus on rich, informative visualizations with professional styling`,
        
        prompt: `Generate enhanced chart configuration with multiple type options for: "${originalQuestion}"
        
        SQL Query: ${sqlQuery}
        Entity Context: ${entityContext || 'General analysis'}
        Sample Data: ${JSON.stringify(queryResults.slice(0, 3), null, 2)}
        Total Records: ${queryResults.length}
        
        Primary goal: Choose the BEST chart type as primary, then suggest 2-3 alternatives that would provide different analytical perspectives on the same data.`,
        
        schema: z.object({
          type: z.enum(['bar', 'line', 'area', 'pie']),
          title: z.string(),
          description: z.string(),
          xKey: z.string(),
          yKeys: z.array(z.string()),
          colors: z.record(z.string(), z.string()).optional(),
          legend: z.boolean(),
          // Enhanced business insights optimized for tooltips and context
          businessInsights: z.array(z.string()),
          takeaway: z.string(),
          // Interactive analysis features
          isTimeSeries: z.boolean(),
          trendAnalysis: z.object({
            direction: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
            changePercent: z.number().optional(),
            seasonality: z.string().optional()
          }).optional(),
          // NEW: Alternative chart suggestions
          alternativeCharts: z.array(z.object({
            type: z.enum(['bar', 'line', 'area', 'pie']),
            reason: z.string().describe('Why this chart type would be valuable for the data'),
            suitability: z.number().min(1).max(10).describe('Suitability score from 1-10'),
            title: z.string().describe('Alternative title optimized for this chart type'),
            analyticalPerspective: z.string().describe('What unique insight this chart type provides')
          })).optional(),
          // Enhanced data quality indicators  
          dataQuality: z.object({
            completeness: z.number(), // 0-100%
            timeRange: z.string(),
            sampleSize: z.string()
          }),
          // Enhanced features metadata
          enhancementLevel: z.enum(['basic', 'moderate', 'high']),
          suggestedAnalyses: z.array(z.string()).optional()
        })
      });
      
      const chartConfig = result.object as {
        type: 'bar' | 'line' | 'area' | 'pie';
        title: string;
        description: string;
        xKey: string;
        yKeys: string[];
        colors?: Record<string, string>;
        legend: boolean;
        businessInsights: string[];
        takeaway: string;
        isTimeSeries: boolean;
        trendAnalysis?: {
          direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
          changePercent?: number;
          seasonality?: string;
        };
        alternativeCharts?: Array<{
          type: 'bar' | 'line' | 'area' | 'pie';
          reason: string;
          suitability: number;
          title: string;
          analyticalPerspective: string;
        }>;
        dataQuality: {
          completeness: number;
          timeRange: string;
          sampleSize: string;
        };
        enhancementLevel: 'basic' | 'moderate' | 'high';
        suggestedAnalyses?: string[];
      };

      // Generate default colors optimized for accessibility and visual appeal
      if (!chartConfig.colors) {
        const defaultColors: Record<string, string> = {};
        chartConfig.yKeys.forEach((key, index) => {
          // Use high-contrast, colorblind-friendly palette
          const colors = [
            '#1f77b4', // Blue
            '#ff7f0e', // Orange  
            '#2ca02c', // Green
            '#d62728', // Red
            '#9467bd', // Purple
            '#8c564b', // Brown
            '#e377c2', // Pink
            '#7f7f7f', // Gray
            '#bcbd22', // Olive
            '#17becf'  // Cyan
          ];
          defaultColors[key] = colors[index % colors.length];
        });
        chartConfig.colors = defaultColors;
      }

      return {
        chartConfig: chartConfig,
        dataPoints: queryResults.length,
        hasTimeSeries: chartConfig.isTimeSeries,
        enhancementLevel: chartConfig.enhancementLevel,
        hasEnhancedFeatures: true,
        hasAlternatives: (chartConfig.alternativeCharts?.length || 0) > 0,
        alternativeCount: chartConfig.alternativeCharts?.length || 0,
        message: `Generated enhanced ${chartConfig.type} chart with ${chartConfig.enhancementLevel} enhancement level and ${chartConfig.alternativeCharts?.length || 0} alternative chart types for ${queryResults.length} data points`
      };

    } catch (e) {
      console.error('Error generating chart config:', e);
      return {
        chartConfig: null,
        error: e instanceof SyntaxError 
          ? 'Invalid JSON data provided for chart generation'
          : 'An error occurred while generating chart configuration',
        suggestion: 'Try rephrasing your request or asking for a simpler chart type'
      };
    }
  },
});





