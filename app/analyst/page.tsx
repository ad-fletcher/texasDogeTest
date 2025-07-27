'use client';

import { useChat } from '@ai-sdk/react';
import { AnalyticsChart } from '@/components/ui/analytics-chart';

export default function Chat() {
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
                  
                  if (result.chartConfig && !result.error) {
                    return (
                      <div key={toolCallId} className="my-4">
                        <AnalyticsChart 
                          chartConfig={result.chartConfig}
                          data={JSON.parse(toolInvocation.args.queryResultsJson)}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={toolCallId} className="p-3 bg-red-100 border border-red-200 rounded">
                        📊 Chart generation failed: {result.error || result.message || 'Unknown error'}
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
                          {result.sections.map((section: any, i: number) => (
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