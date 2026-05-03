import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// ─── Singleton Pinecone client ───────────────────────────────────────────────
let _pinecone: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!_pinecone) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _pinecone;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RAGResult {
  id: string;
  score: number;
  text: string;
  metadata: {
    source: string;
    page: number;
    content_type: string;
    chunk_index: number;
    [key: string]: unknown;
  };
}

// ─── Singleton Google GenAI client (Vertex AI ADC — compatible con Express Mode key) ──
let _genai: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (!_genai) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) throw new Error('GOOGLE_CLOUD_PROJECT is not set');
    
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    // Soporte para Producción en Vercel:
    // Si existe la variable con el JSON de la cuenta de servicio, la guardamos temporalmente en /tmp
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      const tempKeyPath = path.join('/tmp', 'gcp-key.json');
      if (!fs.existsSync(tempKeyPath)) {
        fs.writeFileSync(tempKeyPath, process.env.GOOGLE_CREDENTIALS_JSON);
      }
      // Le decimos al SDK de Google dónde está el archivo
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
    }

    // Para desarrollo local, usará automáticamente tus credenciales de 'gcloud auth application-default login'
    // En Vercel, usará el archivo que acabamos de crear en /tmp.
    _genai = new GoogleGenAI({ 
      vertexai: true,
      project: project,
      location: location
    });
  }
  return _genai;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-2-preview';
const EMBEDDING_DIMENSION = 768;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'agrivision-rag';
const NAMESPACE = 'agrivision-docs';

// ─── Generate embedding for a query via Vertex AI (ADC) ──────────────────────
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  console.log('[Pinecone] Generating embedding for query:', query.substring(0, 50) + '...');
  const client = getGenAIClient();
  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: query,
    config: { outputDimensionality: EMBEDDING_DIMENSION },
  });
  const embedding = response.embeddings?.[0]?.values ?? [];
  console.log('[Pinecone] Embedding generated, length:', embedding.length);
  return embedding;
}

// ─── Query Pinecone for relevant RAG chunks ──────────────────────────────────
export async function queryRAG(
  query: string,
  topK: number = 8,
  filter?: Record<string, unknown>
): Promise<RAGResult[]> {
  console.log('[Pinecone] Querying RAG with:', query.substring(0, 50) + '...');
  console.log('[Pinecone] Index:', INDEX_NAME, 'Namespace:', NAMESPACE);
  
  const embedding = await generateQueryEmbedding(query);

  if (embedding.length === 0) {
    console.error('[Pinecone] Failed to generate embedding for query');
    return [];
  }

  const pc = getPineconeClient();
  const index = pc.index(INDEX_NAME);

  const queryParams: {
    vector: number[];
    topK: number;
    includeMetadata: boolean;
    namespace: string;
    filter?: Record<string, unknown>;
  } = {
    vector: embedding,
    topK,
    includeMetadata: true,
    namespace: NAMESPACE,
  };

  if (filter) {
    queryParams.filter = filter;
  }

  const results = await index.namespace(NAMESPACE).query(queryParams);
  console.log('[Pinecone] Query returned', results.matches?.length || 0, 'matches');

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
    text: (match.metadata?.text as string) || '',
    metadata: {
      source: (match.metadata?.source as string) || '',
      page: (match.metadata?.page as number) || 0,
      content_type: (match.metadata?.content_type as string) || 'text',
      chunk_index: (match.metadata?.chunk_index as number) || 0,
      ...match.metadata,
    },
  }));
}
