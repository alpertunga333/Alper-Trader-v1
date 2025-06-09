
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

// NODE_ENV 'production' olduğunda (next build sırasında olduğu gibi) GOOGLE_GENAI_API_KEY kontrolü
if (!googleApiKey && process.env.NODE_ENV === 'production') {
  throw new Error(
    "Build Error: GOOGLE_GENAI_API_KEY environment variable is not set. " +
    "This is required for Genkit to initialize properly. " +
    "Please set this variable in your Firebase App Hosting build environment settings."
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey, // API anahtarını eklentiye ilet
    }),
  ],
});
