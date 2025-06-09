import nextHandler from '@genkit-ai/next';
import { placeholderGenkitFlow } from '@/ai/flows/placeholder-flow';

// This import ensures that placeholderGenkitFlow (and any other flows in dev.ts)
// are registered on the global `ai` instance, which might be important for
// Genkit's internal mechanisms or the development UI.
import '@/ai/dev';

// Pass the specific flow (Action) to nextHandler
export const POST = nextHandler(placeholderGenkitFlow);
