'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {buildRAGContext} from '@/lib/rag-context';

// Esquema de entrada para el chat de conocimiento
const KnowledgeChatInputSchema = z.object({
    message: z.string().describe('Pregunta del usuario sobre frambuesa Heritage'),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']).describe('Rol del mensaje'),
        content: z.string().describe('Contenido del mensaje'),
    })).optional().describe('Historial de conversación'),
});

// Esquema interno con RAG context inyectado
const KnowledgeChatWithRAGSchema = KnowledgeChatInputSchema.extend({
    ragContext: z.string().describe('Contexto técnico de manuales especializados'),
});

// Esquema de salida
const KnowledgeChatOutputSchema = z.object({
    response: z.string().describe('Respuesta del asistente basada en la base de conocimiento'),
    sources: z.array(z.object({
        source: z.string().describe('Nombre del documento fuente'),
        page: z.number().describe('Número de página'),
        relevance: z.number().describe('Relevancia del resultado (0-100)'),
        snippet: z.string().describe('Fragmento del texto relevante'),
    })).describe('Fuentes utilizadas para la respuesta'),
});

// Definición del prompt
const prompt = ai.definePrompt({
    name: 'knowledgeChatPrompt',
    input: {schema: KnowledgeChatWithRAGSchema},
    output: {schema: z.object({ response: z.string() })},
    prompt: `Eres un experto en cultivo de **Frambuesa Heritage** (Rubus idaeus var. Heritage) en Perú. Respondes consultas técnicas basándote en manuales y documentos especializados.

CULTIVO: Frambuesa Heritage

BASE DE CONOCIMIENTO TÉCNICO (extraída de manuales especializados de frambuesa):
{{{ragContext}}}

INSTRUCCIONES:
1. Analiza el contexto técnico proporcionado arriba
2. Si el contexto contiene información relevante: EXTRAÉ la información específica (dosis, procedimientos, técnicas) y elabora una respuesta TÉCNICA completa (3-4 párrafos) citando las fuentes
3. Si el contexto está vacío o no contiene datos específicos sobre la pregunta: proporciona una respuesta TÉCNICA completa (3-4 párrafos) como experto agrícola usando tu conocimiento especializado
4. En TODOS los casos: responde con autoridad, sin mencionar que falta información ni que estás usando conocimiento general
5. NO excuses, NO disclaimers - solo respuestas técnicas profesionales

HISTORIAL DE CONVERSACIÓN:
{{#each chatHistory}}
- {{role}}: {{content}}
{{/each}}

PREGUNTA DEL USUARIO:
{{{message}}}

REGLAS:
1. Responde SIEMPRE en español
2. Sé preciso, práctico y conciso
3. Si la pregunta NO es sobre frambuesa Heritage o agricultura relacionada, indica amablemente que esta herramienta está especializada en frambuesa Heritage
4. Cita las fuentes del contexto proporcionado
5. Incluye datos específicos cuando estén disponibles (dosis, frecuencias, calendarios)
6. Adapta las recomendaciones al contexto peruano

Responde en JSON con la clave "response". La respuesta debe ser detallada y técnica, no superficial.
`,
});

// Flujo principal
const knowledgeChatFlow = ai.defineFlow(
    {
        name: 'knowledgeChatFlow',
        inputSchema: KnowledgeChatInputSchema,
        outputSchema: KnowledgeChatOutputSchema,
    },
    async (input) => {
        // Build RAG context from the user's question
        const ragQuery = `frambuesa Heritage ${input.message}`;
        const ragResult = await buildRAGContext(ragQuery, 8, 0.25);

        const { output } = await prompt({
            ...input,
            ragContext: ragResult.context,
        });

        return {
            response: output!.response,
            sources: ragResult.sources,
        };
    }
);

// Función exportada
export async function generateKnowledgeChatResponse(
    input: z.infer<typeof KnowledgeChatInputSchema>
): Promise<z.infer<typeof KnowledgeChatOutputSchema>> {
    return knowledgeChatFlow(input);
}

// Exportar tipos
export type KnowledgeChatInput = z.infer<typeof KnowledgeChatInputSchema>;
export type KnowledgeChatOutput = z.infer<typeof KnowledgeChatOutputSchema>;
