import { tool } from 'ai';
import { z } from 'zod';
import { create, all } from 'mathjs';

const math = create(all);

export const calculator = tool({
  description: 'A calculator that can evaluate mathematical expressions.',
  parameters: z.object({
    expression: z.string().describe('The mathematical expression to evaluate.'),
  }),
  execute: async ({ expression }) => {
    try {
      const result = math.evaluate(expression);
      return { result };
    } catch (error) {
      return { error: (error as Error).message };
    }
  },
});
