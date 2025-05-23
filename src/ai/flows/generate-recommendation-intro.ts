
'use server';
/**
 * @fileOverview Generates a user-focused introductory sentence for recommendations.
 *
 * - generateRecommendationIntro - A function that generates the intro text.
 * - GenerateRecommendationIntroInput - The input type.
 * - GenerateRecommendationIntroOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecommendationIntroInputSchema = z.object({
  region: z.string().optional().describe("The user's primary region of operation."),
  businessActivities: z.array(z.string()).optional().describe("The user's main business activities."),
  strategicObjectives: z.array(z.string()).optional().describe("The user's key strategic objectives."),
});
export type GenerateRecommendationIntroInput = z.infer<typeof GenerateRecommendationIntroInputSchema>;

const GenerateRecommendationIntroOutputSchema = z.object({
  introText: z.string().describe("A short, user-focused introductory sentence for the recommendations section (1-2 sentences, max 35 words)."),
});
export type GenerateRecommendationIntroOutput = z.infer<typeof GenerateRecommendationIntroOutputSchema>;

export async function generateRecommendationIntro(input: GenerateRecommendationIntroInput): Promise<GenerateRecommendationIntroOutput> {
  return generateRecommendationIntroFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecommendationIntroPrompt',
  input: {schema: GenerateRecommendationIntroInputSchema},
  output: {schema: GenerateRecommendationIntroOutputSchema},
  prompt: `Based on the user's inputs:
{{#if region}}Region: {{{region}}}{{/if}}
{{#if businessActivities}}Business Activities: {{#each businessActivities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if strategicObjectives}}Strategic Objectives: {{#each strategicObjectives}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Generate a short, friendly introductory sentence (1-2 sentences, max 35 words) to display before showing company incorporation recommendations. This sentence should briefly acknowledge their main focus areas if provided.
Examples:
- "Considering your focus on {{#if businessActivities}}{{businessActivities.[0]}}{{else}}your venture{{/if}} in {{#if region}}{{{region}}}{{else}}your chosen market{{/if}}, here are some tailored incorporation options:"
- "For your business aiming for {{#if strategicObjectives}}{{strategicObjectives.[0]}}{{else}}growth{{/if}}{{#if region}} in {{{region}}}{{/if}}, we've prepared these recommendations:"
- "Here are some incorporation options based on your stated needs and objectives:"

The tone should be helpful, professional, and avoid mentioning "AI". Use "we've prepared", "tailored for you", or similar phrasing. Focus on making the user feel understood.
Provide only the introductory sentence.
`,
});

const generateRecommendationIntroFlow = ai.defineFlow(
  {
    name: 'generateRecommendationIntroFlow',
    inputSchema: GenerateRecommendationIntroInputSchema,
    outputSchema: GenerateRecommendationIntroOutputSchema,
  },
  async input => {
    // Fallback if all inputs are somehow empty, though UI should prevent this.
    if (!input.region && (!input.businessActivities || input.businessActivities.length === 0) && (!input.strategicObjectives || input.strategicObjectives.length === 0)) {
        return { introText: "Here are some incorporation options based on your stated needs and objectives:" };
    }
    const {output} = await prompt(input);
    return output || { introText: "Here are some incorporation options tailored to your needs:" }; // Fallback
  }
);
