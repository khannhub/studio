
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
  introText: z.string().describe("A short, user-focused, formal introductory sentence for the recommendations section (1-2 sentences, max 35 words). It should not give user instructions or end with a colon."),
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

Generate a short, friendly, and formal introductory sentence (1-2 sentences, max 35 words) to display before showing company incorporation recommendations. This sentence should briefly acknowledge their main focus areas if provided.
Do not provide instructions to the user (e.g., 'click a card') and do not end the sentence with a colon.
The tone should be professional, helpful, and business-targeted, avoiding mentions of "AI". Use "we've prepared", "tailored for you", or similar phrasing.
Provide only the introductory sentence.

Examples:
- "Considering your focus on {{#if businessActivities}}{{businessActivities.[0]}}{{else}}your venture{{/if}} in {{#if region}}{{{region}}}{{else}}your chosen market{{/if}}, we've prepared some tailored incorporation options for your review."
- "For your business aiming for {{#if strategicObjectives}}{{strategicObjectives.[0]}}{{else}}growth{{/if}}{{#if region}} in {{{region}}}{{/if}}, we've outlined these recommendations."
- "Here are some incorporation options based on your stated needs and objectives."
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
        return { introText: "Here are some incorporation options based on your stated needs and objectives." };
    }
    const {output} = await prompt(input);
    let intro = output?.introText || "Here are some incorporation options tailored to your needs.";
    // Ensure it doesn't end with a colon, even if AI adds one
    if (intro.endsWith(':')) {
      intro = intro.slice(0, -1);
    }
    return { introText: intro };
  }
);

