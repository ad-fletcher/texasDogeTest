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
import { get } from 'http';
  // Or if using the index file: import { getAgencyCodeTool } from '../../../lib/tools';

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