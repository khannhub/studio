
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
import { JURISDICTIONS_LIST, US_STATES_LIST } from '@/lib/types';

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
    .describe('The recommended jurisdiction for incorporation. MUST be chosen from the provided list.'),
  state: z.string().optional().describe('The recommended US state, if the jurisdiction is United States of America. This MUST be chosen from the provided list and be in "FullName-Abbreviation" format, e.g., "California-CA".'),
  companyType: z.string().describe('The recommended company type (e.g., LLC, Ltd, IBC).'),
  reasoning: z
    .string()
    .describe('The reasoning behind the jurisdiction (and state, if applicable) and company type recommendation.'),
});
export type RecommendIncorporationOutput = z.infer<
  typeof RecommendIncorporationOutputSchema
>;

export async function recommendIncorporation(
  input: RecommendIncorporationInput
): Promise<RecommendIncorporationOutput> {
  return recommendIncorporationFlow(input);
}

const jurisdictionsString = JURISDICTIONS_LIST.join(', ');
const usStatesString = US_STATES_LIST.map(s => `${s.label} (${s.value})`).join('; ');


const prompt = ai.definePrompt({
  name: 'recommendIncorporationPrompt',
  input: {schema: RecommendIncorporationInputSchema},
  output: {schema: RecommendIncorporationOutputSchema},
  prompt: `Based on the business purpose, priorities, and region of operation, recommend the most suitable incorporation jurisdiction and company type.

  Business Purpose: {{{businessPurpose}}}
  Priorities: {{{priorities}}}
  Region of Operation: {{{region}}}

  Constraints:
  1. The recommended 'jurisdiction' MUST be chosen exclusively from the following list: ${jurisdictionsString}.
  2. If 'jurisdiction' is "United States of America", you MUST also recommend a 'state'. This 'state' MUST be chosen exclusively from the following list and provided in "FullName-Abbreviation" format (e.g., "California-CA"): ${usStatesString}. If 'jurisdiction' is not "United States of America", the 'state' field should be omitted or null.
  3. Recommend a common 'companyType' suitable for the chosen jurisdiction and business needs (e.g., LLC, Ltd, Corp, IBC).

  Provide a brief 'reasoning' for your recommendation, explaining why the chosen jurisdiction (and state, if applicable) and company type are suitable, considering the provided lists.
  `,
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
