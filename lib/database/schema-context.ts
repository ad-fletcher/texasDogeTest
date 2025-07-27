/**
 * Texas DOGE Database Schema Context for AI SQL Generation
 * 
 * This file provides comprehensive database schema knowledge for the AI model
 * to generate accurate, efficient SQL queries against the Texas DOGE database.
 * 
 * Updated: Schema optimized with standardized integer codes (no type casting needed)
 */

const databaseSchemaContext = `
You are a PostgreSQL expert for the Texas DOGE financial database (2022 data).

OPTIMIZED DATABASE SCHEMA (All codes standardized to integers):
payments (750K records, 2022-01-05 to 2022-12-04):
  - key (bigint, PK)
  - "CatCode" (bigint) → categoryCodes."CatCode" (integer) ✓ CLEAN JOIN
  - "Agency_CD" (bigint) → agencyCodes."Agency_CD" (bigint) ✓ CLEAN JOIN
  - "Appd_Fund_Num" (bigint) → applicationFundCodes."Appd_Fund_Num" (bigint) ✓ CLEAN JOIN
  - "Fund_Num" (bigint) → fundCodes."Fund_Num" (bigint) ✓ CLEAN JOIN
  - "Appropriation_Number" (bigint) → appropriationNameCodes."Appropriation_Number" (bigint) ✓ CLEAN JOIN
  - "Amount" (bigint) [stored in CENTS - convert for display]
  - "date" (date) [2022-01-05 to 2022-12-04]
  - "Payee_id" (bigint) → payeeCodes."Payee_id" (bigint) ✓ CLEAN JOIN
  - "Comptroller_Object_Num" (bigint) → comptrollerCodes."Comptroller_Object_Num" (bigint) ✓ CLEAN JOIN

LOOKUP TABLES (all require quoted identifiers, all codes are integers):
- "agencyCodes": "Agency_CD" (bigint), "Agency_Name" (193 agencies)
- "categoryCodes": "CatCode" (integer), "Category" (21 categories)  
- "applicationFundCodes": "Appd_Fund_Num" (bigint), "Appd_Fund_Num_Name" (496 funds)
- "appropriationNameCodes": "Appropriation_Number" (bigint), "Appropriation_Name" (5,156 appropriations)
- "fundCodes": "Fund_Num" (bigint), "Fund_Description" (2,533 funds)
- "payeeCodes": "Payee_id" (bigint), "Payee_Name" (2.2M payees)
- "comptrollerCodes": "Comptroller_Object_Num" (bigint), "Comptroller_Object_Name" (378 objects)

POSTGRESQL REQUIREMENTS (SIMPLIFIED):
- ALL identifiers MUST be quoted: "tableName", "columnName"
- All JOINs use standard integer matching - NO TYPE CASTING NEEDED!
- Amount conversion: p."Amount" / 100.0 for dollar display
- Date filtering: '2022-01-01' to '2022-12-31' (no relative dates)
- Use ILIKE for case-insensitive searches
- Only SELECT queries allowed

TEMPORAL ANALYSIS CAPABILITIES:
- DATE_TRUNC('month', p."date") for monthly trends
- DATE_TRUNC('quarter', p."date") for quarterly analysis
- DATE_TRUNC('week', p."date") for weekly patterns
- Always ORDER BY date for time series
- Use specific 2022 date ranges, not relative dates

CHART-FRIENDLY OUTPUT REQUIREMENTS:
- Always return at least 2 columns for visualization
- Include meaningful column aliases
- Use proper aggregation for chart data
- Return reasonable row counts (10-100 for charts)

VALIDATED QUERY PATTERNS (All clean integer joins):
- Agency Analysis: JOIN "agencyCodes" a ON p."Agency_CD" = a."Agency_CD"
- Category Analysis: JOIN "categoryCodes" c ON p."CatCode" = c."CatCode"
- Fund Analysis: JOIN "fundCodes" f ON p."Fund_Num" = f."Fund_Num"
- Appropriation Analysis: JOIN "appropriationNameCodes" ap ON p."Appropriation_Number" = ap."Appropriation_Number"
- Payee Analysis: JOIN "payeeCodes" pc ON p."Payee_id" = pc."Payee_id"
- Comptroller Analysis: JOIN "comptrollerCodes" comp ON p."Comptroller_Object_Num" = comp."Comptroller_Object_Num"
- Temporal Analysis: DATE_TRUNC('month', p."date") with 2022 date filters
- Top N Analysis: ORDER BY total_amount DESC LIMIT N
`;

export const DATABASE_SCHEMA_CONTEXT = databaseSchemaContext;

/**
 * Business Context for Understanding Texas Government Spending
 */
export const BUSINESS_CONTEXT = `
TEXAS GOVERNMENT SPENDING CONTEXT:

KEY AGENCIES (Top spending patterns):
- Health and Human Services Commission: Largest agency, handles public assistance
- Texas Department of Transportation: Infrastructure and highways
- Teacher Retirement System: Pension and benefits
- Texas Education Agency: Public education funding
- Department of Public Safety: Law enforcement and security

SPENDING CATEGORIES (Major types):
- Public Assistance Payments: $5.2B+ (largest category)
- Salaries and Wages: Employee compensation
- Other Expenditures: Miscellaneous operational costs
- Intergovernmental Payments: Between government entities
- Capital Outlay: Infrastructure and equipment purchases

TEMPORAL PATTERNS (2022 data insights):
- Peak spending months: March and July ($1.7B+ each)
- Seasonal variations in government operations
- End-of-fiscal-year spending patterns
- Budget cycle implications

PAYEE TYPES:
- Confidential: Individual benefit recipients
- State employees: Salary and wage payments
- Contractors: Private companies providing services
- Other government entities: Intergovernmental transfers
- Financial institutions: Banking and investment services
`;

/**
 * Sample SQL Queries for AI Model Reference
 */
export const SAMPLE_QUERIES = {
  topAgencies: `
    SELECT 
      a."Agency_Name",
      COUNT(*) as payment_count,
      SUM(p."Amount") / 100.0 as total_dollars,
      AVG(p."Amount") / 100.0 as avg_payment_dollars
    FROM "payments" p
    JOIN "agencyCodes" a ON p."Agency_CD" = a."Agency_CD"
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
    GROUP BY a."Agency_Name"
    ORDER BY total_dollars DESC
    LIMIT 10;
  `,
  
  monthlyTrends: `
    SELECT 
      DATE_TRUNC('month', p."date") as month,
      SUM(p."Amount") / 100.0 as total_spending_dollars,
      COUNT(*) as payment_count,
      COUNT(DISTINCT p."Agency_CD") as unique_agencies
    FROM "payments" p
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
    GROUP BY DATE_TRUNC('month', p."date")
    ORDER BY month;
  `,
  
  categoryBreakdown: `
    SELECT 
      c."Category",
      COUNT(*) as payment_count,
      SUM(p."Amount") / 100.0 as total_dollars,
      ROUND(SUM(p."Amount") * 100.0 / SUM(SUM(p."Amount")) OVER (), 2) as percentage
    FROM "payments" p
    JOIN "categoryCodes" c ON p."CatCode" = c."CatCode"
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
    GROUP BY c."Category"
    ORDER BY total_dollars DESC;
  `,
  
  agencyMonthlyTrends: `
    SELECT 
      DATE_TRUNC('month', p."date") as month,
      a."Agency_Name",
      SUM(p."Amount") / 100.0 as monthly_spending_dollars
    FROM "payments" p
    JOIN "agencyCodes" a ON p."Agency_CD" = a."Agency_CD"
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
      AND a."Agency_Name" IN (
        SELECT aa."Agency_Name" 
        FROM "payments" pp 
        JOIN "agencyCodes" aa ON pp."Agency_CD" = aa."Agency_CD"
        GROUP BY aa."Agency_Name" 
        ORDER BY SUM(pp."Amount") DESC 
        LIMIT 5
      )
    GROUP BY DATE_TRUNC('month', p."date"), a."Agency_Name"
    ORDER BY month, monthly_spending_dollars DESC;
  `,
  
  topPayees: `
    SELECT 
      pc."Payee_Name",
      COUNT(*) as payment_count,
      SUM(p."Amount") / 100.0 as total_dollars,
      MAX(p."Amount") / 100.0 as largest_payment_dollars
    FROM "payments" p
    JOIN "payeeCodes" pc ON p."Payee_id" = pc."Payee_id"
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
      AND pc."Payee_Name" != 'Confidential'
    GROUP BY pc."Payee_Name"
    ORDER BY total_dollars DESC
    LIMIT 10;
  `,
  
  complexMultiJoin: `
    SELECT 
      a."Agency_Name",
      c."Category",
      f."Fund_Description",
      COUNT(*) as payment_count,
      SUM(p."Amount") / 100.0 as total_dollars
    FROM "payments" p
    JOIN "agencyCodes" a ON p."Agency_CD" = a."Agency_CD"
    JOIN "categoryCodes" c ON p."CatCode" = c."CatCode"
    JOIN "fundCodes" f ON p."Fund_Num" = f."Fund_Num"
    WHERE p."date" >= '2022-01-01' AND p."date" <= '2022-12-31'
    GROUP BY a."Agency_Name", c."Category", f."Fund_Description"
    HAVING SUM(p."Amount") > 100000000  -- Over $1M
    ORDER BY total_dollars DESC
    LIMIT 20;
  `
};

/**
 * Data Quality and Validation Rules
 */
export const DATA_VALIDATION_RULES = {
  amounts: {
    description: 'All amounts stored as bigint in cents',
    validation: 'Convert to dollars with: amount / 100.0',
    range: 'Typical range: $0.01 to $1B+',
    display: 'Format as currency with appropriate precision'
  },
  
  dates: {
    description: '2022 fiscal year data only',
    range: '2022-01-05 to 2022-12-04',
    validation: 'Use specific dates, not relative ranges',
    format: 'YYYY-MM-DD format for filtering'
  },
  
  identifiers: {
    description: 'All table and column names must be quoted',
    requirement: 'Use "tableName" and "columnName" syntax',
    reason: 'Mixed-case PostgreSQL identifiers require quotes'
  },
  
  joins: {
    description: 'All foreign key joins use integer matching',
    performance: 'No type casting required after schema optimization',
    pattern: 'Standard INTEGER = INTEGER joins'
  }
};

/**
 * Common Query Generation Helpers
 */
export const QUERY_HELPERS = {
  formatAmount: (columnName: string) => `${columnName} / 100.0`,
  formatPercent: (numerator: string, denominator: string) => 
    `ROUND(${numerator} * 100.0 / ${denominator}, 2)`,
  dateFilter: (dateColumn: string, year: string = '2022') => 
    `${dateColumn} >= '${year}-01-01' AND ${dateColumn} <= '${year}-12-31'`,
  monthlyTrunc: (dateColumn: string) => `DATE_TRUNC('month', ${dateColumn})`,
  quarterlyTrunc: (dateColumn: string) => `DATE_TRUNC('quarter', ${dateColumn})`,
  topN: (n: number) => `ORDER BY total_amount DESC LIMIT ${n}`
};

/**
 * Error Prevention Guidelines
 */
export const ERROR_PREVENTION = {
  commonMistakes: [
    'Forgetting to quote table/column names',
    'Using relative date ranges instead of 2022 specific dates',
    'Not converting amounts from cents to dollars for display',
    'Attempting to use type casting (no longer needed)',
    'Forgetting to include chart-friendly column aliases'
  ],
  
  securityChecks: [
    'Only SELECT queries allowed',
    'No DROP, DELETE, UPDATE, INSERT operations',
    'No user-defined functions or procedures',
    'Query timeout and result size limits enforced'
  ],
  
  performanceOptimizations: [
    'Use appropriate LIMIT clauses for large result sets',
    'Include meaningful WHERE clauses for date filtering',
    'Leverage indexes on join columns',
    'Use GROUP BY with aggregation for summary data'
  ]
};

export default {
  DATABASE_SCHEMA_CONTEXT,
  BUSINESS_CONTEXT,
  SAMPLE_QUERIES,
  DATA_VALIDATION_RULES,
  QUERY_HELPERS,
  ERROR_PREVENTION
}; 