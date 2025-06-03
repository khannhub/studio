'use server';
/**
 * @fileOverview Recommends relevant add-on services based on user's incorporation details and needs.
 *
 * - recommendAddons - A function that handles the add-on recommendation process.
 * - RecommendAddonsInput - The input type.
 * - RecommendAddonsOutput - The return type (internal to flow, then transformed).
 * - RecommendAddonsApiOutput - The final type returned by the exported function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the structure of an available add-on for the AI prompt
const AvailableAddonSchema = z.object({
    id: z.string().describe("The unique identifier for the add-on."),
    name: z.string().describe("The name of the add-on service."),
    description: z.string().describe("A brief description of what the add-on service provides."),
});
type AvailableAddon = z.infer<typeof AvailableAddonSchema>;

const RecommendAddonsInputSchema = z.object({
    mainServiceDetails: z.object({
        jurisdiction: z.string().optional(),
        state: z.string().optional().describe("US state, if applicable."),
        companyType: z.string().optional(),
        packageName: z.string().optional().describe("Selected incorporation package name."),
    }).describe("Details of the main incorporation service selected by the user."),
    userNeeds: z.object({
        region: z.string().optional(),
        businessActivities: z.array(z.string()).optional(),
        strategicObjectives: z.array(z.string()).optional(),
        businessDescription: z.string().optional(),
    }).describe("User's stated needs and objectives from the initial assessment."),
    availableAddons: z.array(AvailableAddonSchema).describe("A list of all available add-on services with their ID, name, and description that the AI can choose to recommend."),
});
export type RecommendAddonsInput = z.infer<typeof RecommendAddonsInputSchema>;

// Internal schema for what the AI model will directly output
const AIModelOutputSchema = z.object({
    recommendedAddonIds: z.array(z.string()).describe("An array of IDs of the add-ons that the AI recommends. These IDs must come from the 'availableAddons' list provided in the input."),
    recommendationReasoningsList: z.array(
        z.object({
            addonId: z.string().describe("The ID of the recommended add-on."),
            reasoning: z.string().describe("The reasoning for this specific add-on recommendation (1-2 sentences, max 25 words).")
        })
    ).describe("An array of objects, each containing an add-on ID and its corresponding reasoning. Each addonId here MUST be present in the recommendedAddonIds array."),
    introText: z.string().describe("A brief, engaging introductory sentence (1-2 sentences, max 30 words) for the add-on recommendations section."),
});

// This is the type the exported recommendAddons function will return (reasonings as a Record)
export interface RecommendAddonsApiOutput {
    recommendedAddonIds: string[];
    recommendationReasonings: Record<string, string>;
    introText: string;
}

export async function recommendAddons(input: RecommendAddonsInput): Promise<RecommendAddonsApiOutput> {
    const aiOutput = await recommendAddonsFlow(input);

    // Transform recommendationReasoningsList to Record<string, string>
    const reasoningsAsRecord: Record<string, string> = {};
    (aiOutput.recommendationReasoningsList || []).forEach(item => {
        reasoningsAsRecord[item.addonId] = item.reasoning;
    });

    return {
        recommendedAddonIds: aiOutput.recommendedAddonIds,
        recommendationReasonings: reasoningsAsRecord,
        introText: aiOutput.introText,
    };
}

const prompt = ai.definePrompt({
    name: 'recommendAddonsPrompt',
    input: { schema: RecommendAddonsInputSchema },
    output: { schema: AIModelOutputSchema }, // AI outputs the list format
    prompt: `You are an expert business advisor assisting a user with their company incorporation.
Based on the user's main service selections (critically considering their chosen jurisdiction and company type), their stated business needs, and the list of available add-on services, identify the most relevant add-ons.

User's Main Service Details:
- Jurisdiction: {{mainServiceDetails.jurisdiction}}
{{#if mainServiceDetails.state}}- State: {{mainServiceDetails.state}}{{/if}}
- Company Type: {{mainServiceDetails.companyType}}
{{#if mainServiceDetails.packageName}}- Package: {{mainServiceDetails.packageName}}{{/if}}

User's Needs Assessment:
{{#if userNeeds.region}}- Primary Region: {{userNeeds.region}}{{/if}}
{{#if userNeeds.businessActivities}}- Business Activities: {{#each userNeeds.businessActivities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if userNeeds.strategicObjectives}}- Strategic Objectives: {{#each userNeeds.strategicObjectives}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if userNeeds.businessDescription}}- Business Description: {{userNeeds.businessDescription}}{{/if}}

Available Add-on Services:
{{#each availableAddons}}
- ID: {{id}}, Name: "{{name}}", Description: "{{description}}"
{{/each}}

Your Task:
1.  **Recommend Add-ons**: From the 'Available Add-on Services' list, select up to 3-4 add-ons that would be most beneficial for the user, paying close attention to how the user's selected jurisdiction and company type might influence the relevance of specific add-ons. Return their IDs in the 'recommendedAddonIds' array. Ensure these IDs exactly match those from the 'availableAddons' list.
2.  **Provide Reasoning**: For each ID in 'recommendedAddonIds', provide a corresponding entry in the 'recommendationReasoningsList' array. Each entry should be an object with "addonId" and "reasoning" (concise 1-2 sentences, max 25 words per reasoning). Connect the reasoning to the user's specific inputs if possible.
3.  **Generate Intro Text**: Create a brief, engaging introductory sentence (1-2 sentences, max 30 words) for the recommendations. Example: "To complement your choices, consider these helpful add-ons."

Output Format:
Provide your response strictly in the JSON format defined by the output schema (AIModelOutputSchema). Ensure all recommended add-on IDs in 'recommendedAddonIds' are present in the 'availableAddons' input and have a corresponding entry in 'recommendationReasoningsList'.
Focus on relevance and clear, concise justifications. Avoid recommending too many add-ons; quality over quantity.
If no add-ons seem particularly relevant, you can return an empty 'recommendedAddonIds' array and an empty 'recommendationReasoningsList', with a generic introText like "Explore our full range of add-ons to customize your package."
`,
});

// Internal flow returns the AIModelOutputSchema structure
const recommendAddonsFlow = ai.defineFlow(
    {
        name: 'recommendAddonsFlow',
        inputSchema: RecommendAddonsInputSchema,
        outputSchema: AIModelOutputSchema, // Flow uses the AI's direct output schema
    },
    async (input): Promise<z.infer<typeof AIModelOutputSchema>> => {
        if (!input.availableAddons || input.availableAddons.length === 0) {
            return {
                recommendedAddonIds: [],
                recommendationReasoningsList: [],
                introText: "Explore our full range of add-ons to customize your package."
            };
        }

        const { output } = await prompt(input);

        if (!output) {
            return {
                recommendedAddonIds: [],
                recommendationReasoningsList: [],
                introText: "We have a range of add-ons you might find useful. Please browse below."
            };
        }

        const validRecommendedIds = output.recommendedAddonIds.filter(id =>
            input.availableAddons.some(addon => addon.id === id)
        );

        const validReasoningsList = (output.recommendationReasoningsList || []).filter(item =>
            validRecommendedIds.includes(item.addonId) && item.reasoning
        );

        // Ensure that all IDs in validRecommendedIds have a corresponding reasoning in validReasoningsList
        const finalRecommendedIds = validRecommendedIds.filter(id =>
            validReasoningsList.some(r => r.addonId === id)
        );
        const finalReasoningsList = validReasoningsList.filter(r =>
            finalRecommendedIds.includes(r.addonId)
        );

        return {
            recommendedAddonIds: finalRecommendedIds,
            recommendationReasoningsList: finalReasoningsList,
            introText: output.introText || "Consider these add-ons to enhance your setup."
        };
    }
);