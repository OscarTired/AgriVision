import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {buildRAGContext} from '@/lib/rag-context';

// Esquema de entrada para el chat de diagnóstico
const DiagnosisChatInputSchema = z.object({
    message: z.string().describe('Mensaje del usuario'),
    diagnosisContext: z.object({
        diseaseName: z.string().describe('Enfermedad o problema identificado'),
        confidence: z.number().describe('Nivel de confianza del diagnóstico'),
        symptoms: z.array(z.string()).describe('Síntomas observados'),
        recommendations: z.array(z.string()).describe('Recomendaciones de manejo'),
        location: z.string().describe('Ubicación del campo'),
        coordinates: z.object({
            lat: z.number().describe('Latitud'),
            lon: z.number().describe('Longitud'),
        }),
        weatherData: z.object({
            temperature: z.number().describe('Temperatura actual'),
            tempHigh: z.number().describe('Temperatura máxima'),
            tempLow: z.number().describe('Temperatura mínima'),
            humidity: z.number().describe('Humedad en porcentaje'),
            windSpeed: z.number().describe('Velocidad del viento'),
            condition: z.string().describe('Condición climática'),
        }),
        date: z.string().describe('Fecha del diagnóstico'),
    }),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']).describe('Rol del mensaje'),
        content: z.string().describe('Contenido del mensaje'),
    })).optional().describe('Historial de conversación'),
});

// Esquema interno con RAG context inyectado
const DiagnosisChatWithRAGSchema = DiagnosisChatInputSchema.extend({
    ragContext: z.string().describe('Contexto de la base de conocimiento RAG'),
});

// Esquema de salida para el chat de diagnóstico
const DiagnosisChatOutputSchema = z.object({
    response: z.string().describe('Respuesta del asistente'),
});

// Definición del prompt para el chat de diagnóstico (con RAG)
const prompt = ai.definePrompt({
    name: 'diagnosisChatPrompt',
    input: {schema: DiagnosisChatWithRAGSchema},
    output: {schema: DiagnosisChatOutputSchema},
    prompt: `Eres un asistente especializado en cultivo de **Frambuesa Heritage** (Rubus idaeus var. Heritage) en Perú. Ayudas a los agricultores con consultas sobre diagnóstico de enfermedades y manejo de este cultivo.

CULTIVO: Frambuesa Heritage

CONTEXTO DEL DIAGNÓSTICO:
- Enfermedad/Problema identificado: {{{diagnosisContext.diseaseName}}}
- Nivel de confianza: {{{diagnosisContext.confidence}}}%
- Ubicación: {{{diagnosisContext.location}}}
- Fecha del diagnóstico: {{{diagnosisContext.date}}}

SÍNTOMAS OBSERVADOS:
{{#each diagnosisContext.symptoms}}
- {{this}}
{{/each}}

RECOMENDACIONES DE MANEJO:
{{#each diagnosisContext.recommendations}}
- {{this}}
{{/each}}

CONDICIONES CLIMÁTICAS ACTUALES:
- Temperatura: {{{diagnosisContext.weatherData.tempLow}}}°C - {{{diagnosisContext.weatherData.tempHigh}}}°C
- Humedad: {{{diagnosisContext.weatherData.humidity}}}%
- Viento: {{{diagnosisContext.weatherData.windSpeed}}} km/h
- Condiciones: {{{diagnosisContext.weatherData.condition}}}

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
2. Enfócate exclusivamente en frambuesa Heritage — si preguntan sobre otros cultivos, indica amablemente que esta app es especializada en frambuesa
3. Usa la BASE DE CONOCIMIENTO TÉCNICO cuando esté disponible para dar respuestas basadas en manuales reales
4. Proporciona información práctica y específica para el manejo de la enfermedad en frambuesa Heritage
5. Usa el contexto climático para dar respuestas precisas sobre el desarrollo de la enfermedad
6. Sé conciso pero informativo
7. Si el usuario pregunta sobre tratamientos, menciona dosis y calendarios si están en la base de conocimiento, y recomienda consultar con un agrónomo local
8. Puedes sugerir medidas preventivas adicionales basadas en el diagnóstico

El formato de salida debe ser un objeto JSON con la clave "response" que contenga tu respuesta.
`,
});

// Flujo principal para el chat de diagnóstico
const diagnosisChatFlow = ai.defineFlow(
    {
        name: 'diagnosisChatFlow',
        inputSchema: DiagnosisChatInputSchema,
        outputSchema: DiagnosisChatOutputSchema,
    },
    async (input) => {
        // Build RAG context from user message + diagnosis context
        const ragQuery = `frambuesa Heritage ${input.diagnosisContext.diseaseName} ${input.message}`;
        const ragResult = await buildRAGContext(ragQuery, 5, 0.3);

        const { output } = await prompt({
            ...input,
            ragContext: ragResult.context,
        });
        return output!;
    }
);

// Función exportada para usar en el frontend
export async function generateDiagnosisChatResponse(
    input: z.infer<typeof DiagnosisChatInputSchema>
): Promise<z.infer<typeof DiagnosisChatOutputSchema>> {
    return diagnosisChatFlow(input);
}

// Exportar tipos para usar en el frontend
export type DiagnosisChatInput = z.infer<typeof DiagnosisChatInputSchema>;
export type DiagnosisChatOutput = z.infer<typeof DiagnosisChatOutputSchema>;