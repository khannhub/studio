
'use server';
/**
 * @fileOverview An AI agent to suggest company details for pre-filling Step 3.
 *
 * - prefillCompanyDetails - A function that suggests company names, director, and contact info.
 * - PrefillCompanyDetailsInput - The input type for the prefillCompanyDetails function.
 * - PrefillCompanyDetailsOutput - The return type for the prefillCompanyDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrefillCompanyDetailsInputSchema = z.object({
  userEmail: z.string().describe("The user's primary email address."),
  userPhone: z.string().optional().describe("The user's phone number."),
  businessPurpose: z.string().describe('The main purpose of the business or company.'),
  businessDescription: z.string().optional().describe('A brief description of the business activities and goals.'),
  selectedJurisdiction: z.string().describe('The selected jurisdiction for incorporation.'),
  selectedState: z.string().optional().describe('The selected US state, if jurisdiction is USA.'),
  selectedCompanyType: z.string().describe('The selected company type.'),
});
export type PrefillCompanyDetailsInput = z.infer<typeof PrefillCompanyDetailsInputSchema>;

const PrefillCompanyDetailsOutputSchema = z.object({
  suggestedCompanyNames: z.object({
    firstChoice: z.string().describe('The primary suggested company name.'),
    secondChoice: z.string().optional().describe('A second alternative company name.'),
    thirdChoice: z.string().optional().describe('A third alternative company name.'),
  }).describe("Up to three suggested company names. Prioritize the first choice."),
  suggestedDirector: z.object({
    fullName: z.string().describe("The suggested full name for the first director. Try to infer from email if not a generic provider. Otherwise, use a placeholder like 'To Be Confirmed' or 'Director Name'."),
    email: z.string().describe('The email for the director, which should be the userEmail input.'),
  }).describe("Suggested details for the first director."),
  suggestedPrimaryContact: z.object({
    fullName: z.string().describe("The suggested full name for the primary contact. Try to infer from email if not a generic provider. Otherwise, use a placeholder like 'To Be Confirmed' or 'Contact Name'."),
    email: z.string().describe('The email for the primary contact, which should be the userEmail input.'),
    phone: z.string().optional().describe('The phone number for the primary contact, which should be the userPhone input if provided.'),
  }).describe("Suggested details for the primary contact person."),
});
export type PrefillCompanyDetailsOutput = z.infer<typeof PrefillCompanyDetailsOutputSchema>;

export async function prefillCompanyDetails(input: PrefillCompanyDetailsInput): Promise<PrefillCompanyDetailsOutput> {
  return prefillCompanyDetailsFlow(input);
}

const genericEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com'];

const prompt = ai.definePrompt({
  name: 'prefillCompanyDetailsPrompt',
  input: {schema: PrefillCompanyDetailsInputSchema},
  output: {schema: PrefillCompanyDetailsOutputSchema},
  prompt: `You are an AI assistant helping a user pre-fill their company formation details.
User's Email: {{{userEmail}}}
User's Phone: {{{userPhone}}}
Business Purpose: {{{businessPurpose}}}
Business Description: {{{businessDescription}}}
Selected Jurisdiction: {{{selectedJurisdiction}}}
Selected US State (if applicable): {{{selectedState}}}
Selected Company Type: {{{selectedCompanyType}}}

Based on this information, provide the following:

1.  **Suggested Company Names**:
    *   Generate 1 to 3 company name suggestions.
    *   The names should be relevant to the business purpose, description, jurisdiction, and company type.
    *   They should sound professional and be plausible.
    *   Consider incorporating elements from the user's email (like a potential organization name if the domain isn't generic like gmail.com, outlook.com, etc.) or the business description.
    *   Ensure the 'firstChoice' is the strongest suggestion.

2.  **Suggested Director**:
    *   For 'fullName':
        *   Attempt to extract a plausible full name from the 'userEmail'. For example, if the email is 'john.doe@company.com', 'John Doe' is a good guess. If it's 'johnd@example.com', 'John D' or 'John Doe (Assumed)' could work.
        *   If the email domain is generic (e.g., ${genericEmailDomains.join(', ')}), or if a name cannot be reasonably inferred, use a placeholder like "To Be Confirmed by User" or "Director Name".
    *   For 'email': Use the provided 'userEmail'.

3.  **Suggested Primary Contact**:
    *   For 'fullName': Use the same logic as for the director's full name. If a name was inferred for the director, use it here. Otherwise, use a placeholder like "To Be Confirmed by User" or "Contact Name".
    *   For 'email': Use the provided 'userEmail'.
    *   For 'phone': Use the provided 'userPhone' if available.

Provide the output in the specified JSON schema.
`,
});

const prefillCompanyDetailsFlow = ai.defineFlow(
  {
    name: 'prefillCompanyDetailsFlow',
    inputSchema: PrefillCompanyDetailsInputSchema,
    outputSchema: PrefillCompanyDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback in case AI fails to generate output matching schema
        // This is a basic fallback. Ideally, the prompt should be robust enough.
        const isGeneric = genericEmailDomains.some(domain => input.userEmail.endsWith(domain));
        const placeholderName = isGeneric ? "To Be Confirmed by User" : "User Name (from Email)";
         return {
            suggestedCompanyNames: {
                firstChoice: `My ${input.selectedCompanyType} in ${input.selectedJurisdiction}`
            },
            suggestedDirector: {
                fullName: placeholderName,
                email: input.userEmail,
            },
            suggestedPrimaryContact: {
                fullName: placeholderName,
                email: input.userEmail,
                phone: input.userPhone,
            }
        };
    }
    return output;
  }
);

    
