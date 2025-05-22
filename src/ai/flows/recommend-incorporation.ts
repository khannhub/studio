
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
import { JURISDICTIONS_LIST, US_STATES_LIST, US_COMPANY_TYPES_LIST, INTERNATIONAL_COMPANY_TYPES_LIST, type IncorporationRecommendationItem } from '@/lib/types';

const RecommendIncorporationInputSchema = z.object({
  businessPurpose: z
    .string()
    .describe('The purpose of the business or company.'),
  priorities: z
    .string()
    .describe(
      'The priorities of the business, such as tax optimization, privacy, or ease of management.'
    ),
  region: z.string().describe('The primary region of operation for the business. This could be "United States of America" or other international regions/global.'),
  // bankingIntent: z.boolean().optional().describe('Whether the user requires banking assistance.'), // Removed
});
export type RecommendIncorporationInput = z.infer<
  typeof RecommendIncorporationInputSchema
>;

const SingleRecommendationSchema = z.object({
  jurisdiction: z
    .string()
    .describe('The recommended jurisdiction for incorporation. MUST be chosen from the provided list.'),
  state: z.string().optional().describe('The recommended US state, if the jurisdiction is United States of America. This MUST be chosen from the provided list and be in "FullName-Abbreviation" format, e.g., "California-CA". Omit if jurisdiction is not USA.'),
  companyType: z.string().describe('The recommended company type. If jurisdiction is "United States of America", choose from US-specific list. Otherwise, choose from the international list.'),
  shortDescription: z.string().describe('A very brief (10-15 words) tagline or key feature summary for this specific recommendation. E.g., "Popular for US startups, strong legal framework."'),
  reasoning: z
    .string()
    .describe('The reasoning behind this specific recommendation (jurisdiction, state if applicable, company type). Use markdown bold syntax (**text**) to highlight the most important phrases or key ideas. For the "bestRecommendation", provide more detailed reasoning (3-4 sentences). For "alternativeRecommendations", keep reasoning concise (2-3 sentences).'),
  price: z.number().int().min(100).max(5000).describe('A base price (integer between 100 and 5000 USD) for setting up this specific incorporation (jurisdiction and company type). Example: 1299.'),
});

const RecommendIncorporationOutputSchema = z.object({
  bestRecommendation: SingleRecommendationSchema.describe("The single best recommendation based on the user's input. Provide more detailed reasoning for this pick."),
  alternativeRecommendations: z.array(SingleRecommendationSchema).length(3).describe("Exactly three alternative recommendations, distinct from the best recommendation and from each other. Keep reasoning for alternatives concise.")
});

export type RecommendIncorporationOutput = z.infer<
  typeof RecommendIncorporationOutputSchema
>;


export async function recommendIncorporation(
  input: RecommendIncorporationInput
): Promise<RecommendIncorporationOutput> {
  const result = await recommendIncorporationFlow(input);
  // Ensure the bestRecommendation has the isBestPick flag if we need it later, though not in schema for AI
  return {
      ...result,
      bestRecommendation: { ...result.bestRecommendation, isBestPick: true } as IncorporationRecommendationItem,
      alternativeRecommendations: result.alternativeRecommendations.map(alt => ({...alt, isBestPick: false}))
  };
}

const jurisdictionsString = JURISDICTIONS_LIST.join(', ');
const usStatesString = US_STATES_LIST.map(s => `${s.label}-${s.value.split('-')[1]}`).join('; '); // Use "FullName-Abbreviation" for prompt consistency. Original value includes FullName too.
const usCompanyTypesString = US_COMPANY_TYPES_LIST.join(', ');
const intlCompanyTypesString = INTERNATIONAL_COMPANY_TYPES_LIST.join(', ');


const prompt = ai.definePrompt({
  name: 'recommendIncorporationPrompt',
  input: {schema: RecommendIncorporationInputSchema},
  output: {schema: RecommendIncorporationOutputSchema},
  prompt: `You are an expert international business incorporation advisor.
Based on the user's business purpose, priorities, and primary region of operation, provide one 'bestRecommendation' and exactly three 'alternativeRecommendations' for incorporation.

User Inputs:
  Business Purpose: {{{businessPurpose}}}
  Priorities: {{{priorities}}}
  Region of Operation: {{{region}}}

Available Options:
  Jurisdictions: ${jurisdictionsString}
  US States (format: FullName-Abbreviation, e.g., "Delaware-DE"): ${usStatesString}
  US Company Types: ${usCompanyTypesString}
  International Company Types: ${intlCompanyTypesString}

Output Structure for EACH recommendation (bestRecommendation and each of the 3 alternatives):
  -   'jurisdiction': MUST be chosen from the 'Jurisdictions' list.
  -   'state': (Optional) If 'jurisdiction' is "United States of America", MUST recommend a 'state' from the 'US States' list (e.g., "Delaware-DE"). Otherwise, omit 'state'.
  -   'companyType': If 'jurisdiction' is "United States of America", MUST be chosen from 'US Company Types'. Otherwise, MUST be chosen from 'International Company Types'.
  -   'shortDescription': A very brief (10-15 words) tagline or key feature summary for this specific recommendation.
  -   'reasoning': For the 'bestRecommendation', provide comprehensive reasoning (3-4 sentences). For 'alternativeRecommendations', provide concise reasoning (2-3 sentences). Use markdown bold syntax (**text**) to highlight key phrases or ideas in all reasonings.
  -   'price': An estimated base price (integer between 100 and 5000 USD) for this specific incorporation. Example: 1299.

Specific Instructions:
1.  **Primary Region "United States of America"**:
    *   If the user's 'Region of Operation' is "United States of America", then the 'jurisdiction' for the 'bestRecommendation' MUST be "United States of America", and you MUST also recommend a 'state'. The alternatives can be international or other US states.
2.  **Other Primary Regions**:
    *   If 'Region of Operation' is not "United States of America", you can recommend any suitable jurisdiction from the list, including "United States of America" (with a state) if it's a strong strategic fit.
3.  **Distinct Recommendations**: Ensure the 'bestRecommendation' and all three 'alternativeRecommendations' are distinct from each other in terms of (jurisdiction, state, companyType) combination.
4.  **Pricing**: Provide a realistic base 'price' for each of the four recommendations.
5.  **Reasoning Length**: Ensure the 'bestRecommendation' has more detailed reasoning than the alternatives.

Generate the 'bestRecommendation' and 'alternativeRecommendations' according to the schema.
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
