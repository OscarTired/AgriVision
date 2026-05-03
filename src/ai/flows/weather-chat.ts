'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {buildRAGContext} from '@/lib/rag-context';

// Esquema de entrada para el chat de clima
const WeatherChatInputSchema = z.object({
    message: z.string().describe('Mensaje del usuario'),
    weatherContext: z.object({
        location: z.string().describe('Ubicación del campo'),
        coordinates: z.object({
            lat: z.number().describe('Latitud'),
            lon: z.number().describe('Longitud'),
        }),
        date: z.string().describe('Fecha de la consulta'),
        tempHigh: z.number().describe('Temperatura máxima en °C'),
        tempLow: z.number().describe('Temperatura mínima en °C'),
        humidity: z.number().describe('Humedad en porcentaje'),
        windSpeed: z.number().describe('Velocidad del viento en km/h'),
        condition: z.string().describe('Condición climática'),
        recommendations: z.array(z.string()).describe('Recomendaciones previas generadas'),
    }),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']).describe('Rol del mensaje'),
        content: z.string().describe('Contenido del mensaje'),
    })).optional().describe('Historial de conversación'),
});

// Esquema interno con RAG context
const WeatherChatWithRAGSchema = WeatherChatInputSchema.extend({
    ragContext: z.string().describe('Contexto de la base de conocimiento RAG'),
});

// Esquema de salida para el chat de clima
const WeatherChatOutputSchema = z.object({
    response: z.string().describe('Respuesta del asistente'),
});

// Definición del prompt para el chat de clima (con RAG)
const prompt = ai.definePrompt({
    name: 'weatherChatPrompt',
    input: {schema: WeatherChatWithRAGSchema},
    output: {schema: WeatherChatOutputSchema},
    prompt: `Eres un asistente especializado en el cultivo de **Frambuesa Heritage** (Rubus idaeus var. Heritage) en Perú, con enfoque en cómo las condiciones climáticas afectan este cultivo.

CULTIVO: Frambuesa Heritage

CONTEXTO CLIMÁTICO ACTUAL:
- Ubicación: {{{weatherContext.location}}}
- Fecha: {{{weatherContext.date}}}
- Temperatura: {{{weatherContext.tempLow}}}°C - {{{weatherContext.tempHigh}}}°C
- Humedad: {{{weatherContext.humidity}}}%
- Viento: {{{weatherContext.windSpeed}}} km/h
- Condiciones: {{{weatherContext.condition}}}

RECOMENDACIONES PREVIAS GENERADAS:
{{#each weatherContext.recommendations}}
- {{this}}
{{/each}}

{{#if ragContext}}
BASE DE CONOCIMIENTO TÉCNICO (manuales de frambuesa):
{{{ragContext}}}
{{/if}}

HISTORIAL DE CONVERSACIÓN:
{{#each chatHistory}}
- {{content}}
{{/each}}

PREGUNTA ACTUAL DEL USUARIO:
{{{message}}}

INSTRUCCIONES:
1. Responde en español de manera clara y profesional
2. Enfócate en cómo las condiciones climáticas afectan al cultivo de frambuesa Heritage
3. Usa la BASE DE CONOCIMIENTO TÉCNICO cuando esté disponible para dar respuestas basadas en manuales reales
4. Proporciona información práctica sobre riego, protección contra heladas, ventilación, etc. para frambuesa
5. Si preguntan sobre otros cultivos, indica amablemente que esta app es especializada en frambuesa Heritage
6. Relaciona las condiciones climáticas con riesgos específicos de frambuesa (ej: humedad alta → riesgo de Botrytis)
7. Sé conciso pero informativo

El formato de salida debe ser un objeto JSON con la clave "response" que contenga tu respuesta.
`,
});

// Flujo principal para el chat de clima
const weatherChatFlow = ai.defineFlow(
    {
        name: 'weatherChatFlow',
        inputSchema: WeatherChatInputSchema,
        outputSchema: WeatherChatOutputSchema,
    },
    async (input) => {
        // Build RAG context from user message + weather context
        const ragQuery = `frambuesa Heritage clima ${input.weatherContext.condition} temperatura ${input.weatherContext.tempHigh}°C humedad ${input.weatherContext.humidity}% ${input.message}`;
        const ragResult = await buildRAGContext(ragQuery, 5, 0.3);

        const { output } = await prompt({
            ...input,
            ragContext: ragResult.context,
        });
        return output!;
    }
);

// Función exportada para usar en el frontend
export async function generateWeatherChatResponse(
    input: z.infer<typeof WeatherChatInputSchema>
): Promise<z.infer<typeof WeatherChatOutputSchema>> {
    return weatherChatFlow(input);
}

// Exportar tipos para usar en el frontend
export type WeatherChatInput = z.infer<typeof WeatherChatInputSchema>;
export type WeatherChatOutput = z.infer<typeof WeatherChatOutputSchema>;