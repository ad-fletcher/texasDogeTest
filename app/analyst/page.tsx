'use client';

import { useChat } from '@ai-sdk/react';
import { AnalyticsChart } from '@/components/ui/analytics-chart';
import { downloadCSVFromServer, formatEstimatedSize } from '@/lib/utils/csv';
import { useState } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 50, // Enable multi-step tool usage
  });

  // Add state for download progress
  const [downloadingQueries, setDownloadingQueries] = useState<Set<string>>(new Set());

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
            {message.toolInvocations?.map((toolInvocation) => {
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
                      <div key={toolCallId} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <span className="text-red-600 mr-2">⚠️</span>
                          <span className="font-medium text-red-800">Chart Generation Failed</span>
                        </div>
                        <p className="text-red-700 text-sm">
                          {result.error || result.message || 'Unknown error occurred'}
                        </p>
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
                          {result.sections.map((section: { sqlSection: string; explanation: string }, i: number) => (
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
                
                // NEW: Prepare Bulk Download Tool Result (Phase 1)
                else if (toolName === 'prepareBulkDownload') {
                  const { result } = toolInvocation;
                  
                  if (result.success && result.prepared) {
                    const isDownloading = downloadingQueries.has(toolCallId);
                    
                    const handleDownload = async () => {
                      setDownloadingQueries(prev => new Set(prev).add(toolCallId));
                      
                      try {
                        await downloadCSVFromServer(result.sqlQuery, result.filename);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Could add toast notification here
                        alert('Download failed: ' + (error as Error).message);
                      } finally {
                        setDownloadingQueries(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(toolCallId);
                          return newSet;
                        });
                      }
                    };
                    
                    return (
                      <div key={toolCallId} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center mb-2">
                              <span className="text-green-600 mr-2">📊</span>
                              <span className="font-medium text-green-800">CSV Download Ready</span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                              <p><strong>Estimated Records:</strong> {result.estimatedRows.toLocaleString()}</p>
                              <p><strong>Columns:</strong> {result.csvColumns?.length || 'Multiple'}</p>
                              <p><strong>Estimated Size:</strong> {formatEstimatedSize(result.estimatedRows, result.csvColumns?.length)}</p>
                              <p><strong>File:</strong> {result.filename}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                              isDownloading 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {isDownloading ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <span>📥</span>
                                <span>Download CSV</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Query Preview - No Data Preview since we don't execute */}
                        <div className="bg-white border rounded p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Query Preview:</h4>
                          <p className="text-xs text-gray-600 mb-2">{result.explanation}</p>
                          <p className="text-xs text-gray-500">
                            <strong>Entity Context:</strong> {result.entityContext}
                          </p>
                        </div>
                        
                        {/* Query Information */}
                        <details className="mt-3">
                          <summary className="text-sm text-green-700 cursor-pointer hover:text-green-800">
                            View SQL Query
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                            {result.sqlQuery}
                          </pre>
                        </details>
                        
                        {/* Performance Note */}
                        <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded text-xs">
                          <p className="text-blue-800">
                            <strong>💡 Performance:</strong> Large datasets (&gt;50K records) may take several minutes to download.  Downloading is currently limited to 1000 records
                            The download will start automatically when ready.
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={toolCallId} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <span className="text-red-600 mr-2">⚠️</span>
                          <span className="font-medium text-red-800">CSV Preparation Failed</span>
                        </div>
                        <p className="text-red-700 text-sm mb-2">
                          {result.error || 'Unknown error occurred during CSV preparation'}
                        </p>
                        {result.suggestion && (
                          <p className="text-red-600 text-xs italic">💡 {result.suggestion}</p>
                        )}
                      </div>
                    );
                  }
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
                        {toolName === 'prepareBulkDownload' && '📋 Preparing download...'}
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
        {/* Enhanced Quick Action Buttons with Download Options */}
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
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Show top 10 payees by total amount with a bar chart" }
            })}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
          >
            💰 Top Payees Chart
          </button>
          
          {/* NEW: Download-focused buttons */}
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Download all agency spending data as CSV" }
            })}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
          >
            📥 Download Agency Data
          </button>
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Export monthly spending trends for 2022 to CSV" }
            })}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
          >
            📊 Export Monthly Data
          </button>
          <button 
            onClick={() => handleSubmit(undefined, {
              data: { message: "Download Health and Human Services spending breakdown as CSV" }
            })}
            className="px-3 py-1 bg-pink-100 text-pink-700 rounded text-sm hover:bg-pink-200"
          >
            🏥 HHS Bulk Download
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
        
        {/* Interactive Features Help */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 <strong>Chart Features:</strong> Enhanced tooltips with insights • 
          Zoom controls on time series charts • Hover effects for better visualization
        </div>
        
        {/* Smart Download Suggestions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 <strong>Download Tips:</strong> 
          Say &quot;download as CSV&quot; or &quot;export to CSV&quot; after any query to get the complete dataset • 
          Large downloads (&gt;10k records) may take a few moments • 
          Files are optimized for Excel and data analysis tools
        </div>
      </div>
    </div>
  );
}