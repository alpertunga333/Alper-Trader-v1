import {nextHandler} from '@genkit-ai/next';
import {ai} from '@/ai/ai-instance';

import '@/ai/dev'; // Import flows to register them

export const POST = nextHandler(ai);
