'use client';

import { useChat } from '@ai-sdk/react';

// Mapping from technical tool names to user-friendly display names
const getToolDisplayName = (toolName: string): string => {
  const toolDisplayNames: Record<string, string> = {
    // Entity lookup tools
    'getAgencyCode': 'Looking for related Agencies to:',
    'getApplicationFundCode': 'Looking for related Application Funds to:',
    'getAppropriationCode': 'Looking for related Appropriation Codes to:',
    'getCategoryCode': 'Looking for related Category Codes to:',
    'getFundCode': 'Looking for related Fund Codes to:', 
    'getPayeeCode': 'Looking for related Payee Codes to:',
    'getComptrollerCode': 'Looking for related Comptroller Codes to:',
    
    // SQL analytics tools (working tools)
    'generateAnalyticsQuery': '📊 Generating SQL query for:',
    'executeQuery': '⚡ Executing database query...',
    'explainQuery': '📖 Explaining SQL query:', // ✅ fixed and working
    // 'generateChart': '📈 Creating data visualization:', // ❌ temporarily disabled
  };
  
  return toolDisplayNames[toolName] || toolName;
};

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 15,
  });
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
                        <p className="font-semibold">{getToolDisplayName(toolName)}</p>
                        <pre className="text-xs mt-2 whitespace-pre-wrap">
                          {JSON.stringify(args.searchTerm, null, 2)}
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