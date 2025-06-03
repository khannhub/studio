'use server';

/**
 * @fileOverview Summarizes a business description provided by the user.
 *
 * - summarizeBusinessDescription - A function that summarizes the business description.
 * - SummarizeBusinessDescriptionInput - The input type for the summarizeBusinessDescription function.
 * - SummarizeBusinessDescriptionOutput - The return type for the summarizeBusinessDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeBusinessDescriptionInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('The business description to summarize.'),
});
export type SummarizeBusinessDescriptionInput = z.infer<
  typeof SummarizeBusinessDescriptionInputSchema
>;

const SummarizeBusinessDescriptionOutputSchema = z.object({
  summary: z.string().describe('The summarized business description.'),
});
export type SummarizeBusinessDescriptionOutput = z.infer<
  typeof SummarizeBusinessDescriptionOutputSchema
>;

export async function summarizeBusinessDescription(
  input: SummarizeBusinessDescriptionInput
): Promise<SummarizeBusinessDescriptionOutput> {
  return summarizeBusinessDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeBusinessDescriptionPrompt',
  input: {schema: SummarizeBusinessDescriptionInputSchema},
  output: {schema: SummarizeBusinessDescriptionOutputSchema},
  prompt: `Summarize the following business description: {{{businessDescription}}}`,
});

const summarizeBusinessDescriptionFlow = ai.defineFlow(
  {
    name: 'summarizeBusinessDescriptionFlow',
    inputSchema: SummarizeBusinessDescriptionInputSchema,
    outputSchema: SummarizeBusinessDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
