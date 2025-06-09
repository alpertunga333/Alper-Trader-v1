
'use server';
/**
 * @fileOverview A placeholder Genkit flow.
 * This flow is added to ensure the Genkit 'ai' instance has at least one flow registered,
 * which might be necessary for the '@genkit-ai/next' nextHandler to correctly process it
 * and avoid type errors during the build process.
 *
 * - placeholderGenkitFlow - The Genkit flow object.
 * - runPlaceholderFlow - A function that handles the placeholder flow execution.
 * - PlaceholderInputSchema - The input type for the placeholder flow.
 * - PlaceholderOutputSchema - The return type for the placeholder flow.
 */
import {ai} from '@/ai/ai-instance'; // Ensure this path is correct
import {z} from 'genkit/zod'; // Use genkit/zod for schema definitions

export const PlaceholderInputSchema = z.object({
  message: z.string().describe('A simple message input.'),
});
export type PlaceholderInput = z.infer<typeof PlaceholderInputSchema>;

export const PlaceholderOutputSchema = z.object({
  reply: z.string().describe('A simple reply output.'),
});
export type PlaceholderOutput = z.infer<typeof PlaceholderOutputSchema>;

// This is the actual flow definition registered with Genkit
// Exporting the flow object itself for use with nextHandler
export const placeholderGenkitFlow = ai.defineFlow(
  {
    name: 'placeholderFlow',
    inputSchema: PlaceholderInputSchema,
    outputSchema: PlaceholderOutputSchema,
    description: 'A simple placeholder flow that echoes the input message.'
  },
  async (input) => {
    return {reply: `Placeholder flow received: ${input.message}`};
  }
);

// Exported wrapper function to call the flow (as per Genkit guidelines)
export async function runPlaceholderFlow(input: PlaceholderInput): Promise<PlaceholderOutput> {
  return placeholderGenkitFlow(input);
}
