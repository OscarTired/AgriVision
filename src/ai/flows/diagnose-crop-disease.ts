// src/ai/flows/diagnose-crop-disease.ts
'use server';

/**
 * @fileOverview Multi-step diagnosis flow specialized for Frambuesa Heritage (raspberry).
 *
 * Pipeline:
 *   Step 1: IDENTIFY  — Confirm image contains a raspberry plant
 *   Step 2: DIAGNOSE  — Detect disease/issue with raspberry-specific knowledge
 *   Step 3: RAG       — Enrich with Pinecone knowledge base (agricultural PDFs)
 *   Step 4: RESPOND   — Final enhanced response with RAG sources
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {buildRAGContext, type RAGSource} from '@/lib/rag-context';

// ─── Input Schema ────────────────────────────────────────────────────────────
const DiagnoseCropDiseaseInputSchema = z.object({
  cropImage: z
    .string()
    .describe(
      "Foto del cultivo como URI de datos Base64. Formato: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  weatherData: z.object({
    location: z.string().describe("Nombre de la ubicación."),
    coordinates: z.object({
      lat: z.number().describe("Latitud."),
      lon: z.number().describe("Longitud."),
    }),
    temperature: z.number().describe("Temperatura actual en °C."),
    tempHigh: z.number().describe("Temperatura máxima en °C."),
    tempLow: z.number().describe("Temperatura mínima en °C."),
    condition: z.string().describe("Condición climática actual."),
    humidity: z.number().describe("Humedad relativa en %."),
    windSpeed: z.number().describe("Velocidad promedio del viento en km/h."),
    windSpeedMin: z.number().describe("Velocidad mínima del viento en km/h."),
    windSpeedMax: z.number().describe("Velocidad máxima del viento en km/h."),
    icon: z.any().describe("Ícono del clima (ignorado en el diagnóstico)."),
  }),
  date: z.string().describe('Fecha de la consulta en formato ISO.'),
});

export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

// ─── Output Schema ───────────────────────────────────────────────────────────
const DiagnoseCropDiseaseOutputSchema = z.object({
  // Step 1: Plant identification
  plantIdentification: z.object({
    isRaspberry: z.boolean().describe('Si la imagen contiene una planta de frambuesa.'),
    confidence: z.number().describe('Confianza de la identificación (0-1).'),
    detectedPlant: z.string().describe('Qué se detectó en la imagen (ej: "Frambuesa Heritage", "Tomate", "No es una planta").'),
  }),
  // Step 2: Disease diagnosis
  diseaseName: z.string().describe('Nombre de la enfermedad o problema detectado.'),
  confidence: z.number().describe('Nivel de confianza del diagnóstico (0-1).'),
  symptoms: z.array(z.string()).describe('Síntomas observados en la imagen.'),
  // Step 4: Recommendations (RAG-enriched)
  recommendations: z.array(z.string()).describe('Recomendaciones de manejo enriquecidas con base de conocimiento.'),
  enrichedRecommendations: z.array(z.string()).describe('Recomendaciones específicas extraídas de los manuales técnicos (RAG).'),
  ragSources: z.array(z.object({
    source: z.string(),
    page: z.number(),
    relevance: z.number(),
    snippet: z.string(),
  })).describe('Fuentes de la base de conocimiento utilizadas.'),
  aiResponseToQuestion: z.string().optional().describe('Respuesta del asistente si el agricultor hizo una pregunta.'),
});

export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

// ─── Step 1: Plant Identification Prompt ─────────────────────────────────────
const IdentifyPlantOutputSchema = z.object({
  isRaspberry: z.boolean().describe('true si la imagen contiene una planta de frambuesa Heritage o frambuesa en general.'),
  confidence: z.number().describe('Confianza de la identificación (0.0 a 1.0).'),
  detectedPlant: z.string().describe('Descripción de lo que se detectó en la imagen.'),
  reasoning: z.string().describe('Explicación breve de por qué se llegó a esa conclusión.'),
});

const identifyPlantPrompt = ai.definePrompt({
  name: 'identifyRaspberryPrompt',
  input: {schema: z.object({ cropImage: z.string() })},
  output: {schema: IdentifyPlantOutputSchema},
  prompt: `Eres un experto botánico especializado en identificación de plantas de frambuesa (Rubus idaeus), específicamente la variedad Heritage.

Analiza la imagen proporcionada y determina:
1. ¿La imagen contiene una planta de frambuesa? (hojas trifoliadas con bordes aserrados, tallos con espinas, frutos rojos/rosados agregados)
2. ¿Con qué nivel de confianza puedes afirmarlo?
3. Si NO es una frambuesa, ¿qué es lo que se observa en la imagen?

Características clave de la frambuesa Heritage:
- Hojas compuestas, trifoliadas o pentafoliadas, con bordes aserrados
- Envés de las hojas blanquecino/plateado
- Tallos (cañas) erectos con espinas pequeñas
- Frutos: drupas agregadas de color rojo brillante cuando maduros
- Flores blancas pequeñas con 5 pétalos
- Crecimiento en forma de arbusto con cañas de 1-2 metros

IMPORTANTE: Si la imagen muestra un objeto que NO es una planta (persona, animal, objeto, paisaje sin plantas), marca isRaspberry como false y confidence como 0.0.

Imagen: {{media url=cropImage}}

Responde en JSON con: isRaspberry, confidence, detectedPlant, reasoning.`,
});

// ─── Step 2: Disease Diagnosis Prompt (raspberry-specialized) ────────────────
const DiagnosisStepOutputSchema = z.object({
  diseaseName: z.string(),
  confidence: z.number(),
  symptoms: z.array(z.string()),
  recommendations: z.array(z.string()),
  aiResponseToQuestion: z.string().optional(),
});

const diagnoseRaspberryPrompt = ai.definePrompt({
  name: 'diagnoseRaspberryPrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnosisStepOutputSchema},
  prompt: `Eres un fitopatólogo experto especializado en frambuesa Heritage (Rubus idaeus var. Heritage) cultivada en Perú.

CULTIVO: Frambuesa Heritage
La imagen muestra una planta de frambuesa Heritage. Analiza la imagen y los datos climáticos para diagnosticar cualquier enfermedad o problema.

ENFERMEDADES COMUNES EN FRAMBUESA HERITAGE:
- **Botrytis cinerea (Moho gris)**: Pudrición gris en frutos, favorecida por alta humedad (>80%) y temperaturas 15-25°C
- **Roya (Phragmidium rubi-idaei)**: Pústulas anaranjadas en envés de hojas
- **Oídio (Sphaerotheca macularis)**: Polvo blanco en hojas y frutos
- **Antracnosis (Elsinoe veneta)**: Lesiones púrpuras/grises en cañas
- **Tizón de la caña (Didymella applanata)**: Manchas marrones en la base de cañas
- **Marchitez por Verticillium**: Amarillamiento y marchitez progresiva
- **Virus del mosaico**: Decoloración en mosaico de las hojas
- **Agalla de la corona (Agrobacterium)**: Tumores en la base del tallo
- **Ácaros (Tetranychus urticae)**: Punteado amarillento en hojas
- **Drosophila suzukii**: Daño en frutos maduros
- **Deficiencias nutricionales**: Clorosis (hierro), bordes quemados (potasio)
- **Planta sana**: Si no se detecta ningún problema

DATOS CLIMÁTICOS:
- Ubicación: {{{weatherData.location}}}
- Coordenadas: {{{weatherData.coordinates.lat}}}, {{{weatherData.coordinates.lon}}}
- Temperatura: {{{weatherData.temperature}}}°C (Mín: {{{weatherData.tempLow}}}°C, Máx: {{{weatherData.tempHigh}}}°C)
- Condición: {{{weatherData.condition}}}
- Humedad: {{{weatherData.humidity}}}%
- Viento: {{{weatherData.windSpeed}}} km/h
- Fecha: {{{date}}}

Imagen: {{media url=cropImage}}

INSTRUCCIONES:
1. Identifica la enfermedad o problema más probable
2. Lista los síntomas observados en la imagen
3. Relaciona las condiciones climáticas con el diagnóstico (ej: "Humedad de 85% favorece desarrollo de Botrytis")
4. Proporciona recomendaciones específicas para frambuesa Heritage en Perú
5. Si la planta parece sana, indícalo con confianza

Responde en español. Formato JSON con: diseaseName, confidence, symptoms, recommendations.`,
});

// ─── Step 4: RAG-Enhanced Final Response Prompt ──────────────────────────────
const EnrichedResponseInputSchema = z.object({
  diseaseName: z.string(),
  symptoms: z.array(z.string()),
  recommendations: z.array(z.string()),
  ragContext: z.string(),
  weatherSummary: z.string(),
});

const EnrichedResponseOutputSchema = z.object({
  enrichedRecommendations: z.array(z.string()),
  updatedRecommendations: z.array(z.string()),
});

const enrichWithRAGPrompt = ai.definePrompt({
  name: 'enrichDiagnosisWithRAGPrompt',
  input: {schema: EnrichedResponseInputSchema},
  output: {schema: EnrichedResponseOutputSchema},
  prompt: `Eres un asesor técnico en cultivo de frambuesa Heritage en Perú. Se te proporciona un diagnóstico previo y conocimiento técnico extraído de manuales especializados.

DIAGNÓSTICO PREVIO:
- Enfermedad/Problema: {{{diseaseName}}}
- Síntomas: {{#each symptoms}}- {{this}}\n{{/each}}
- Recomendaciones iniciales: {{#each recommendations}}- {{this}}\n{{/each}}

CONDICIONES CLIMÁTICAS:
{{{weatherSummary}}}

BASE DE CONOCIMIENTO TÉCNICO (extraída de manuales de frambuesa):
{{{ragContext}}}

INSTRUCCIONES:
1. Revisa las recomendaciones iniciales y mejóralas usando la información de los manuales técnicos
2. Agrega recomendaciones específicas que aparezcan en la base de conocimiento y sean relevantes para el diagnóstico
3. Las "enrichedRecommendations" deben ser SOLO las recomendaciones nuevas extraídas de los manuales (con referencia a la fuente)
4. Las "updatedRecommendations" deben ser la lista final completa de recomendaciones (las iniciales mejoradas + las nuevas)
5. Prioriza información práctica, dosis específicas, y calendarios de aplicación si están disponibles
6. Mantén el contexto peruano y prácticas sostenibles

Responde en español. Formato JSON con: enrichedRecommendations, updatedRecommendations.`,
});

// ─── Main Flow ───────────────────────────────────────────────────────────────
export async function diagnoseCropDisease(
  input: DiagnoseCropDiseaseInput
): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async (input) => {
    // ── Step 1: Identify if the image contains a raspberry plant ──
    const {output: identifyOutput} = await identifyPlantPrompt({cropImage: input.cropImage});
    const plantId = identifyOutput!;

    // If not a raspberry, return early with identification result
    if (!plantId.isRaspberry || plantId.confidence < 0.3) {
      return {
        plantIdentification: {
          isRaspberry: plantId.isRaspberry,
          confidence: plantId.confidence,
          detectedPlant: plantId.detectedPlant,
        },
        diseaseName: 'No se puede diagnosticar',
        confidence: 0,
        symptoms: [],
        recommendations: [
          plantId.isRaspberry
            ? 'La confianza en la identificación es muy baja. Por favor, suba una imagen más clara de la planta de frambuesa Heritage.'
            : `La imagen muestra: "${plantId.detectedPlant}". Esta aplicación está especializada en Frambuesa Heritage. Por favor, suba una imagen de una planta de frambuesa.`,
        ],
        enrichedRecommendations: [],
        ragSources: [],
        aiResponseToQuestion: plantId.reasoning,
      };
    }

    // ── Step 2: Diagnose disease (raspberry-specialized) ──
    const {output: diagnosisOutput} = await diagnoseRaspberryPrompt(input);
    const diagnosis = diagnosisOutput!;

    // ── Step 3: RAG enrichment ──
    const ragQuery = `frambuesa Heritage ${diagnosis.diseaseName} ${diagnosis.symptoms.join(' ')} tratamiento prevención manejo`;
    const ragResult = await buildRAGContext(ragQuery, 8, 0.25);

    let enrichedRecommendations: string[] = [];
    let finalRecommendations = diagnosis.recommendations;
    let ragSources: RAGSource[] = ragResult.sources;

    // ── Step 4: Enhance with RAG context if available ──
    if (ragResult.hasRelevantContent) {
      const weatherSummary = `Ubicación: ${input.weatherData.location}, Temp: ${input.weatherData.tempLow}°C-${input.weatherData.tempHigh}°C, Humedad: ${input.weatherData.humidity}%, Viento: ${input.weatherData.windSpeed} km/h, Condición: ${input.weatherData.condition}`;

      const {output: enrichedOutput} = await enrichWithRAGPrompt({
        diseaseName: diagnosis.diseaseName,
        symptoms: diagnosis.symptoms,
        recommendations: diagnosis.recommendations,
        ragContext: ragResult.context,
        weatherSummary,
      });

      if (enrichedOutput) {
        enrichedRecommendations = enrichedOutput.enrichedRecommendations;
        finalRecommendations = enrichedOutput.updatedRecommendations;
      }
    }

    return {
      plantIdentification: {
        isRaspberry: plantId.isRaspberry,
        confidence: plantId.confidence,
        detectedPlant: plantId.detectedPlant,
      },
      diseaseName: diagnosis.diseaseName,
      confidence: diagnosis.confidence,
      symptoms: diagnosis.symptoms,
      recommendations: finalRecommendations,
      enrichedRecommendations,
      ragSources,
      aiResponseToQuestion: diagnosis.aiResponseToQuestion,
    };
  }
);
