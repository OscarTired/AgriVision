import { queryRAG, type RAGResult } from './pinecone';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RAGSource {
  source: string;
  page: number;
  relevance: number;
  snippet: string;
}

export interface RAGContextResult {
  context: string;
  sources: RAGSource[];
  hasRelevantContent: boolean;
}

// ─── Build RAG context for injection into Genkit prompts ─────────────────────
export async function buildRAGContext(
  query: string,
  topK: number = 8,
  minScore: number = 0.15
): Promise<RAGContextResult> {
  try {
    console.log('[RAG] Building context for query:', query);
    const results = await queryRAG(query, topK);
    console.log('[RAG] Raw results count:', results.length);
    console.log('[RAG] Raw results scores:', results.map(r => r.score));

    if (results.length === 0) {
      console.log('[RAG] No results returned from vector search');
      return {
        context: '',
        sources: [],
        hasRelevantContent: false,
      };
    }

    const sortedResults = results
      .filter((r) => r.text.trim().length > 0)
      .sort((a, b) => b.score - a.score);

    if (sortedResults.length === 0) {
      console.log('[RAG] Results returned without usable text');
      return {
        context: '',
        sources: [],
        hasRelevantContent: false,
      };
    }

    const bestScore = sortedResults[0]?.score ?? 0;
    const relativeFloor = bestScore > 0 ? bestScore * 0.70 : 0;
    const effectiveMinScore = Math.min(minScore, relativeFloor);
    const relevant = sortedResults.filter((r) => r.score >= effectiveMinScore).slice(0, topK);
    const selectedResults = relevant.length > 0 ? relevant : sortedResults.slice(0, Math.min(topK, 5));

    console.log('[RAG] Effective minimum score:', effectiveMinScore);
    console.log('[RAG] Selected results:', selectedResults.length);

    // Deduplicate by source + page (keep highest score)
    const deduped = deduplicateResults(selectedResults).slice(0, topK);

    // Build context string
    const contextBlocks = deduped.map((r, i) => {
      const sourceLabel = formatSourceName(r.metadata.source);
      return `[Fuente ${i + 1}: ${sourceLabel}, p.${r.metadata.page}]\n${r.text.trim()}`;
    });

    const context = contextBlocks.join('\n\n---\n\n');

    // Build source citations
    const sources: RAGSource[] = deduped.map((r) => ({
      source: formatSourceName(r.metadata.source),
      page: r.metadata.page,
      relevance: normalizeRelevance(r.score, bestScore),
      snippet: r.text.substring(0, 150).trim() + (r.text.length > 150 ? '...' : ''),
    }));

    return {
      context,
      sources,
      hasRelevantContent: true,
    };
  } catch (error) {
    console.error('[RAG Context] Error building context:', error);
    return {
      context: '',
      sources: [],
      hasRelevantContent: false,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deduplicateResults(results: RAGResult[]): RAGResult[] {
  const seen = new Map<string, RAGResult>();

  for (const r of results) {
    const key = `${r.metadata.source}::${r.metadata.page}::${r.metadata.chunk_index}`;
    const existing = seen.get(key);
    if (!existing || r.score > existing.score) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

function formatSourceName(source: string): string {
  if (!source) return 'Documento';

  // Remove file extension and clean up
  return source
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRelevance(score: number, bestScore: number): number {
  if (bestScore <= 0) return 0;

  const relativeScore = score / bestScore;
  return Math.max(1, Math.min(100, Math.round(relativeScore * 100)));
}
