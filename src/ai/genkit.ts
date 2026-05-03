import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/google-genai';

// Usamos Vertex AI Express Mode: autenticación por API key (sin service account).
// Compatible con proyectos gen-lang-client-* vinculados a AI Studio.
// Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview
export const ai = genkit({
  plugins: [
    vertexAI({
      apiKey: process.env.GOOGLE_API_KEY!,
    }),
  ],
  model: vertexAI.model('gemini-2.5-flash'),
});
