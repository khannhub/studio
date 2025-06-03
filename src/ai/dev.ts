import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recommendation-intro.ts';
import '@/ai/flows/prefill-company-details.ts';
import '@/ai/flows/recommend-addons.ts';
import '@/ai/flows/recommend-incorporation.ts';
import '@/ai/flows/summarize-business-description.ts';
