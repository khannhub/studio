// src/ai/flows/recommend-incorporation.ts
'use server';

/**
 * @fileOverview Recommends the most suitable incorporation jurisdiction and company type based on user input.
 *
 * - recommendIncorporation - A function that handles the incorporation recommendation process.
 * - RecommendIncorporationInput - The input type for the recommendIncorporation function.
 * - RecommendIncorporationOutput - The return type for the recommendIncorporation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendIncorporationInputSchema = z.object({
  businessPurpose: z
    .string()
    .describe('The purpose of the business or company.'),
  priorities: z
    .string()
    .describe(
      'The priorities of the business, such as tax optimization, privacy, or ease of management.'
    ),
  region: z.string().describe('The primary region of operation for the business.'),
});
export type RecommendIncorporationInput = z.infer<
  typeof RecommendIncorporationInputSchema
>;

const RecommendIncorporationOutputSchema = z.object({
  jurisdiction: z
    .string()
    .describe('The recommended jurisdiction for incorporation.'),
  companyType: z.string().describe('The recommended company type.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the jurisdiction and company type recommendation.'),
});
export type RecommendIncorporationOutput = z.infer<
  typeof RecommendIncorporationOutputSchema
>;

export async function recommendIncorporation(
  input: RecommendIncorporationInput
): Promise<RecommendIncorporationOutput> {
  return recommendIncorporationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendIncorporationPrompt',
  input: {schema: RecommendIncorporationInputSchema},
  output: {schema: RecommendIncorporationOutputSchema},
  prompt: `Based on the business purpose, priorities, and region of operation, recommend the most suitable incorporation jurisdiction and company type.

  Business Purpose: {{{businessPurpose}}}
  Priorities: {{{priorities}}}
  Region of Operation: {{{region}}}

  Provide a brief reasoning for your recommendation.
  `, // Ensure that the prompt is well-formatted and clear
});

const recommendIncorporationFlow = ai.defineFlow(
  {
    name: 'recommendIncorporationFlow',
    inputSchema: RecommendIncorporationInputSchema,
    outputSchema: RecommendIncorporationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
