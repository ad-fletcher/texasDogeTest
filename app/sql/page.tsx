'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Search, Play, Table as TableIcon, BarChart3, HelpCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Types
interface QueryResult {
  [key: string]: any;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  description: string;
  takeaway: string;
  xKey: string;
  yKeys: string[];
  colors: Record<string, string>;
  legend: boolean;
}

// Suggested queries for initial display
const SUGGESTED_QUERIES = [
  {
    text: "Show me the top 5 agencies by total spending",
    description: "Find which agencies have spent the most money overall"
  },
  {
    text: "What are the spending trends over time for healthcare?",
    description: "Analyze healthcare spending patterns by month or year"
  },
  {
    text: "Which payees received the most funding last year?",
    description: "Identify the largest recipients of government payments"
  },
  {
    text: "Compare spending between different fund types",
    description: "See how different types of funds are being utilized"
  },
  {
    text: "Show me payments over $1 million in the last 6 months",
    description: "Find large transactions in recent timeframe"
  },
  {
    text: "What categories of spending are most common?",
    description: "Analyze spending distribution by category"
  }
];

export default function SQLChat() {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [activeQuery, setActiveQuery] = useState('');
  const [queryExplanations, setQueryExplanations] = useState<Array<{section: string, explanation: string}>>([]);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [queryExpanded, setQueryExpanded] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear existing data when starting new query
  const clearExistingData = () => {
    setResults([]);
    setColumns([]);
    setActiveQuery('');
    setQueryExplanations([]);
    setChartConfig(null);
    setError(null);
    setQueryExpanded(false);
    setActiveView('table');
  };

  // Handle form submission
  const handleSubmit = async (suggestion?: string) => {
    clearExistingData();

    const question = suggestion ?? inputValue;
    if (inputValue.length === 0 && !suggestion) return;

    if (question.trim()) {
      setSubmitted(true);
    }

    setLoading(true);
    setLoadingStep(1);
    setActiveQuery('');

    try {
      // TODO: Implement actual API calls
      // Step 1: Generate SQL query
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock generated SQL for now
      const mockQuery = `SELECT a.agency_name, SUM(p.amount) as total_amount
FROM payments p
JOIN agencyCodes a ON p.agency_cd = a.agency_cd
GROUP BY a.agency_name
ORDER BY total_amount DESC
LIMIT 5;`;
      
      setActiveQuery(mockQuery);
      setLoadingStep(2);

      // Step 2: Execute query
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock results for now
      const mockResults = [
        { agency_name: 'Health and Human Services Commission', total_amount: 5000000000 },
        { agency_name: 'Department of Transportation', total_amount: 3500000000 },
        { agency_name: 'Texas Education Agency', total_amount: 2800000000 },
        { agency_name: 'Department of Public Safety', total_amount: 1200000000 },
        { agency_name: 'Parks and Wildlife Department', total_amount: 800000000 }
      ];
      
      setResults(mockResults);
      setColumns(mockResults.length > 0 ? Object.keys(mockResults[0]) : []);

      setLoading(false);

      // Step 3: Generate chart config (optional)
      const mockChartConfig: ChartConfig = {
        type: 'bar',
        title: 'Top 5 Agencies by Total Spending',
        description: 'Total spending amounts by government agency',
        takeaway: 'Health and Human Services Commission has the highest spending',
        xKey: 'agency_name',
        yKeys: ['total_amount'],
        colors: { total_amount: 'hsl(var(--chart-1))' },
        legend: false
      };
      
      setChartConfig(mockChartConfig);
      
    } catch (e) {
      console.error('Error executing query:', e);
      setError('An error occurred while processing your query. Please try again.');
      setLoading(false);
    }
  };

  // Handle query explanation
  const handleExplainQuery = async () => {
    setQueryExpanded(true);
    setLoadingExplanation(true);

    // TODO: Implement actual explanation API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Mock explanations
    const mockExplanations = [
      { section: 'SELECT a.agency_name, SUM(p.amount)', explanation: 'Select agency names and calculate the total amount spent by each agency' },
      { section: 'FROM payments p', explanation: 'Start with the main payments table' },
      { section: 'JOIN agencyCodes a ON p.agency_cd = a.agency_cd', explanation: 'Join with agency codes table to get readable agency names' },
      { section: 'GROUP BY a.agency_name', explanation: 'Group results by agency name to aggregate spending' },
      { section: 'ORDER BY total_amount DESC', explanation: 'Sort agencies by total spending in descending order' },
      { section: 'LIMIT 5', explanation: 'Return only the top 5 results' }
    ];
    
    setQueryExplanations(mockExplanations);
    setLoadingExplanation(false);
  };

  // Handle suggested query click
  const handleSuggestedQuery = (queryText: string) => {
    setInputValue(queryText);
    handleSubmit(queryText);
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Texas DOGE SQL Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about Texas government spending in natural language
        </p>
      </div>

      {/* Suggested Queries (show when no query submitted) */}
      {!submitted && (
        <Card>
          <CardHeader>
            <CardTitle>Try asking questions like:</CardTitle>
            <CardDescription>
              Click on any suggestion below to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {SUGGESTED_QUERIES.map((query, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSuggestedQuery(query.text)}
                >
                  <div className="font-medium text-sm">{query.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {query.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form */}
      <div className="relative">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask a question about Texas government spending..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={() => handleSubmit()} 
            disabled={loading || !inputValue.trim()}
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {loading ? 'Processing...' : 'Run Query'}
          </Button>
        </div>
      </div>

      {/* Loading Steps */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${loadingStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <span className={loadingStep >= 1 ? 'text-primary' : 'text-muted-foreground'}>
                  Generating SQL query...
                </span>
                {loadingStep === 1 && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${loadingStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                <span className={loadingStep >= 2 ? 'text-primary' : 'text-muted-foreground'}>
                  Executing query...
                </span>
                {loadingStep === 2 && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Display */}
      {activeQuery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated SQL Query</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExplainQuery}
                disabled={loadingExplanation}
              >
                <HelpCircle className="h-4 w-4" />
                {loadingExplanation ? 'Loading...' : 'Explain'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {activeQuery}
              </pre>
            </div>
            
            {/* Query Explanations */}
            {queryExpanded && queryExplanations.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Query Explanation:</h4>
                {queryExplanations.map((explanation, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {explanation.section}
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {explanation.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {results.length} row{results.length !== 1 ? 's' : ''} returned
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('table')}
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </Button>
                {chartConfig && (
                  <Button
                    variant={activeView === 'chart' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('chart')}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Chart
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeView === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column}>
                            {column.includes('amount') || column.includes('total') 
                              ? formatCurrency(row[column])
                              : row[column]?.toString() || 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : chartConfig && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{chartConfig.title}</h3>
                  <p className="text-sm text-muted-foreground">{chartConfig.description}</p>
                </div>
                <ChartContainer
                  config={{
                    [chartConfig.yKeys[0]]: {
                      label: chartConfig.yKeys[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      color: chartConfig.colors[chartConfig.yKeys[0]]
                    }
                  }}
                  className="h-[400px]"
                >
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={chartConfig.xKey}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [formatCurrency(value), 'Total Amount']}
                    />
                    <Bar 
                      dataKey={chartConfig.yKeys[0]} 
                      fill={chartConfig.colors[chartConfig.yKeys[0]]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                {chartConfig.takeaway && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Key Insight:</strong> {chartConfig.takeaway}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
