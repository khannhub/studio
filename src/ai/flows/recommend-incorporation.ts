
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
  businessActivities: z
    .array(z.string())
    .describe('A list of main business activities of the company.'),
  strategicObjectives: z
    .array(z.string())
    .describe(
      'A list of key strategic objectives for the incorporation, such as tax optimization, privacy, or ease of management.'
    ),
  region: z.string().describe('The primary region of operation for the business. This could be "USA (Exclusive Focus)" or other international regions.'),
  businessDescription: z.string().optional().describe('A brief description of the business activities and goals. If "Other" business activities or objectives were selected from the card options, details should be provided here.')
});
export type RecommendIncorporationInput = z.infer<
  typeof RecommendIncorporationInputSchema
>;

const SingleRecommendationSchema = z.object({
  jurisdiction: z
    .string()
    .describe('The recommended jurisdiction for incorporation. MUST be chosen from the provided list. If primary region is "USA (Exclusive Focus)", this MUST be "United States of America".'),
  state: z.string().optional().describe('The recommended US state, if the jurisdiction is United States of America. This MUST be chosen from the provided list and be in "FullName-Abbreviation" format, e.g., "California-CA". Omit if jurisdiction is not USA. If primary region is "USA (Exclusive Focus)", a state MUST be recommended.'),
  companyType: z.string().describe('The recommended company type. If jurisdiction is "United States of America", choose from US-specific list. Otherwise, choose from the international list. If primary region is "USA (Exclusive Focus)", this MUST be from the US list.'),
  shortDescription: z.string().describe('A very brief (10-15 words) tagline or key feature summary for this specific recommendation. E.g., "Popular for US startups, strong legal framework."'),
  reasoning: z
    .string()
    .describe('The reasoning behind this specific recommendation (jurisdiction, state if applicable, company type). Use markdown bold syntax (**text**) to highlight the most important phrases or key ideas. For the "bestRecommendation", provide more detailed reasoning (3-4 sentences). For "alternativeRecommendations", keep reasoning concise (2-3 sentences). Maintain a formal and business-targeted tone.'),
  price: z.number().int().min(100).max(1000).describe('A base price (integer between 100 and 1000 USD) for setting up this specific incorporation (jurisdiction, state if applicable, and company type). Example: 499.'), // Adjusted price range
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
  // Ensure the best pick has the flag, and others don't
  return {
      ...result,
      bestRecommendation: { ...result.bestRecommendation, isBestPick: true } as IncorporationRecommendationItem,
      alternativeRecommendations: result.alternativeRecommendations.map(alt => ({...alt, isBestPick: false}))
  };
}

const jurisdictionsString = JURISDICTIONS_LIST.join(', ');
const usStatesString = US_STATES_LIST.map(s => `${s.label}-${s.value.split('-')[1]}`).join('; '); // Format for AI prompt
const usCompanyTypesString = US_COMPANY_TYPES_LIST.join(', ');
const intlCompanyTypesString = INTERNATIONAL_COMPANY_TYPES_LIST.join(', ');


const prompt = ai.definePrompt({
  name: 'recommendIncorporationPrompt',
  input: {schema: RecommendIncorporationInputSchema},
  output: {schema: RecommendIncorporationOutputSchema},
  prompt: `You are an expert international business incorporation advisor.
Based on the user's business activities, strategic objectives, and primary region of operation, provide one 'bestRecommendation' and exactly three 'alternativeRecommendations' for incorporation.
Ensure all 'reasoning' text is formal, professional, and targeted towards a business audience.

User Inputs:
  Business Activities:
  {{#each businessActivities}}
  - {{{this}}}
  {{/each}}
  Strategic Objectives:
  {{#each strategicObjectives}}
  - {{{this}}}
  {{/each}}
  Region of Operation: {{{region}}}
  {{#if businessDescription}}
  Business Description (This may contain elaborations if "Other Business Activity" or "Other Strategic Objective" were selected from the card options): {{{businessDescription}}}
  {{/if}}

Available Options:
  Jurisdictions (for non-USA exclusive focus): ${jurisdictionsString}
  US States (format: FullName-Abbreviation, e.g., "Delaware-DE"): ${usStatesString}
  US Company Types: ${usCompanyTypesString}
  International Company Types: ${intlCompanyTypesString}

Output Structure for EACH recommendation (bestRecommendation and each of the 3 alternatives):
  -   'jurisdiction': MUST be chosen from the 'Jurisdictions' list if region is not 'USA (Exclusive Focus)'. If region is 'USA (Exclusive Focus)', 'jurisdiction' MUST be "United States of America".
  -   'state': (Optional) If 'jurisdiction' is "United States of America", MUST recommend a 'state' from the 'US States' list (e.g., "Delaware-DE"). If region is 'USA (Exclusive Focus)', a state MUST be recommended. Otherwise, omit 'state' unless "United States of America" is chosen as jurisdiction.
  -   'companyType': If 'jurisdiction' is "United States of America", MUST be chosen from 'US Company Types'. Otherwise, MUST be chosen from 'International Company Types'. If region is 'USA (Exclusive Focus)', companyType MUST be from 'US Company Types'.
  -   'shortDescription': A very brief (10-15 words) tagline or key feature summary for this specific recommendation.
  -   'reasoning': For the 'bestRecommendation', provide comprehensive reasoning (3-4 sentences). For 'alternativeRecommendations', provide concise reasoning (2-3 sentences). Use markdown bold syntax (**text**) to highlight key phrases or ideas in all reasonings. Ensure reasoning is formal and business-like.
  -   'price': An estimated base price (integer between 100 and 1000 USD) for this specific incorporation. Example: 499. This price is for the core incorporation service only, before any packages or government fees.

Specific Instructions:
1.  **Primary Region "USA (Exclusive Focus)"**:
    *   If the user's 'Region of Operation' is "USA (Exclusive Focus)":
        *   The 'jurisdiction' for the 'bestRecommendation' MUST be "United States of America", and you MUST recommend a 'state' from the 'US States' list and a 'companyType' from the 'US Company Types' list.
        *   ALL THREE 'alternativeRecommendations' MUST also have 'jurisdiction' as "United States of America", recommend a distinct 'state' from the 'US States' list, and a 'companyType' from the 'US Company Types' list. Each of the four recommendations (best + 3 alternatives) must be unique in terms of (state, companyType) combination.
2.  **Other Primary Regions**:
    *   If 'Region of Operation' is not "USA (Exclusive Focus)", you can recommend any suitable jurisdiction from the 'Jurisdictions' list for all recommendations, including "United States of America" (with a state and US company type) if it's a strong strategic fit. The 'bestRecommendation' can be any suitable jurisdiction.
3.  **Distinct Recommendations**: Ensure the 'bestRecommendation' and all three 'alternativeRecommendations' are distinct from each other in terms of (jurisdiction, state, companyType) combination.
4.  **Pricing**: Provide a realistic base 'price' (between 100 and 1000 USD) for each of the four recommendations.
5.  **Reasoning Length & Highlighting**: Ensure the 'bestRecommendation' has more detailed reasoning (3-4 sentences) than the alternatives (2-3 sentences). Use markdown bold syntax (**text**) to highlight key phrases or ideas in all reasonings. Ensure the tone is formal and business-like.
6.  **"Other" Options**: If "Other Business Activity" is present in the 'Business Activities' list, or "Other Strategic Objective" is in the 'Strategic Objectives' list, refer to the 'Business Description' field for user's elaboration on these "Other" items and incorporate this understanding into your recommendations.

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

