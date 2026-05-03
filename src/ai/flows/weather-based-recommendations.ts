'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {buildRAGContext} from '@/lib/rag-context';

// Esquema de entrada para recomendaciones basadas en el clima
const GenerateRecommendationsInputSchema = z.object({
    location: z.string().describe('Ubicación del campo (por ejemplo, "Lima, Perú")'),
    coordinates: z.object({
        lat: z.number().describe('Latitud'),
        lon: z.number().describe('Longitud'),
    }),
    date: z.string().describe('Fecha de la consulta en formato ISO (por ejemplo, "2023-10-01")'),
    tempHigh: z.number().describe('Temperatura máxima en °C'),
    tempLow: z.number().describe('Temperatura mínima en °C'),
    humidity: z.number().describe('Humedad en porcentaje'),
    windSpeed: z.number().describe('Velocidad del viento en km/h'),
    condition: z.string().describe('Condición climática (por ejemplo, "Despejado", "Lluvia")'),
});

// Esquema interno con RAG
const RecommendationsWithRAGSchema = GenerateRecommendationsInputSchema.extend({
    ragContext: z.string().describe('Contexto de la base de conocimiento RAG'),
});

// Esquema de salida para recomendaciones basadas en el clima
const GenerateRecommendationsOutputSchema = z.object({
    recommendations: z.array(z.string()).describe('Recomendaciones basadas en el clima para el cultivo de frambuesa Heritage'),
});

// Funcion de exportacion para usar el flujo de recomendaciones basadas en el clima
export async function generateWeatherBasedRecommendations(
    input: z.infer<typeof GenerateRecommendationsInputSchema>
): Promise<z.infer<typeof GenerateRecommendationsOutputSchema>> {
    return generateWeatherBasedRecommendationsFlow(input);
}

// Definición del prompt para Vertex AI
const prompt = ai.definePrompt({
    name: 'generateWeatherBasedRecommendationsPrompt',
    input: {schema: RecommendationsWithRAGSchema},
    output: {schema: GenerateRecommendationsOutputSchema},
    prompt: `Eres un asesor técnico experto en cultivo de **Frambuesa Heritage** (Rubus idaeus var. Heritage) en Perú.
Tu objetivo es proporcionar recomendaciones específicas para frambuesa Heritage basadas en las condiciones climáticas actuales.
Siempre responde en español, con lenguaje claro y directo adaptado al agricultor peruano.

CULTIVO: Frambuesa Heritage

Datos climáticos y ubicación:
- Ubicación: {{{location}}}
- Coordenadas: Latitud: {{{coordinates.lat}}}, Longitud: {{{coordinates.lon}}}
- Fecha: {{{date}}}
- Temperatura máxima: {{{tempHigh}}}°C
- Temperatura mínima: {{{tempLow}}}°C
- Humedad: {{{humidity}}}%
- Velocidad del viento: {{{windSpeed}}} km/h
- Condición climática: {{{condition}}}

{{#if ragContext}}
BASE DE CONOCIMIENTO TÉCNICO (manuales de frambuesa):
{{{ragContext}}}
{{/if}}

Proporciona recomendaciones específicas para frambuesa Heritage sobre:
- **Riego**: Frambuesa Heritage necesita riego regular pero no encharcamiento. ¿Cómo ajustar según el clima actual?
- **Protección**: ¿Se necesita protección contra heladas, exceso de sol, o lluvia intensa?
- **Enfermedades**: ¿Qué enfermedades de frambuesa favorecen las condiciones actuales? (ej: Botrytis con humedad >80%)
- **Poda y manejo de cañas**: ¿Es buen momento para poda según el clima?
- **Fertilización**: ¿Qué aplicaciones son recomendables para frambuesa en estas condiciones?
- **Cosecha**: Si es temporada, ¿cómo afecta el clima a la cosecha de frambuesa?

Usa la base de conocimiento técnico si está disponible para dar recomendaciones más precisas y basadas en manuales.
El formato de salida debe ser un arreglo de strings con las recomendaciones.
`,
});

// Definición del flujo que usa el prompt
const generateWeatherBasedRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async input => {
    // Build RAG context for raspberry weather recommendations
    const ragQuery = `frambuesa Heritage manejo clima temperatura ${input.tempHigh}°C humedad ${input.humidity}% ${input.condition} riego protección`;
    const ragResult = await buildRAGContext(ragQuery, 5, 0.3);

    const { output } = await prompt({
      ...input,
      ragContext: ragResult.context,
    });
    return output!;
  }
);