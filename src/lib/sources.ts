import { sourceCorpus, type SourceCorpusDocument } from "./source-corpus";

export type SourceChunkRow = {
  id: string;
  source_id: string;
  source_type: string;
  title: string;
  url: string | null;
  chunk_index: number;
  content: string;
  content_hash: string;
  vector_id: string;
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RetrievedSource = {
  id: string;
  title: string;
  url: string | null;
  content: string;
  score: number | null;
};

export type SourceStats = {
  chunks: number;
  indexedChunks: number;
  sources: number;
  vectorCount: number | null;
  vectorDimensions: number | null;
  freshness: SourceCorpusFreshness;
  byType: Array<{
    sourceType: string;
    sources: number;
    chunks: number;
    indexedChunks: number;
  }>;
};

export type ExpectedSourceCorpusStats = {
  documents: number;
  chunks: number;
  byType: Array<{
    sourceType: SourceCorpusDocument["sourceType"];
    documents: number;
    chunks: number;
  }>;
  sourceIds: string[];
};

export type SourceCorpusFreshness = {
  status: "fresh" | "missing" | "stale" | "unknown";
  checkedAt: string;
  expectedDocuments: number;
  observedDocuments: number;
  expectedChunks: number;
  observedChunks: number;
  observedIndexedChunks: number;
  missingSourceIds: string[];
  staleSourceIds: string[];
  expectedByType: ExpectedSourceCorpusStats["byType"];
  detail: string;
};

export type SourceCorpusSyncResult = {
  ok: boolean;
  refreshed: boolean;
  before: SourceCorpusFreshness;
  after: SourceCorpusFreshness;
  receipt: Awaited<ReturnType<typeof ingestSourceDocuments>> | null;
};

export type RevenueCatDocsIndexEntry = {
  path: string;
  description: string;
  url: string;
  markdownUrl: string;
};

export type RevenueCatDocsIngestOptions = {
  cursor?: number;
  batchSize?: number;
  includeIndexOnlyFallback?: boolean;
};

type FetchTextResult = {
  ok: boolean;
  status: number;
  contentType: string;
  text: string;
  error?: string;
};

const embeddingModel = "@cf/baai/bge-base-en-v1.5";
const sourceNamespace = "revenuecat";
const maxChunkCharacters = 1400;
const maxEmbeddingBatchSize = 24;
const maxVectorBatchSize = 100;
const revenueCatDocsBaseUrl = "https://www.revenuecat.com/docs";
const revenueCatLlmsIndexUrl = `${revenueCatDocsBaseUrl}/llms.txt`;
const lexicalStopWords = new Set([
  "about",
  "does",
  "from",
  "have",
  "into",
  "says",
  "that",
  "the",
  "this",
  "what",
  "when",
  "where",
  "which",
  "will",
  "with",
]);

function shortHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36).padStart(7, "0").slice(-7);
}

function slug(value: string, maxLength = 52) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length <= maxLength) return normalized;

  const suffix = shortHash(value);
  const prefix = normalized.slice(0, maxLength - suffix.length - 1);
  return `${prefix.replace(/-+$/g, "")}-${suffix}`;
}

export function sourceIdForDocument(document: SourceCorpusDocument) {
  return slug(document.id);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function chunksForDocument(document: SourceCorpusDocument) {
  const raw = document.content.trim();
  const chunks: string[] = [];

  for (let index = 0; index < raw.length; index += maxChunkCharacters) {
    chunks.push(raw.slice(index, index + maxChunkCharacters));
  }

  return chunks.length > 0 ? chunks : [raw];
}

export function getExpectedSourceCorpusStats(
  documents: SourceCorpusDocument[] = sourceCorpus,
): ExpectedSourceCorpusStats {
  const byType = new Map<
    SourceCorpusDocument["sourceType"],
    { sourceType: SourceCorpusDocument["sourceType"]; documents: number; chunks: number }
  >();
  let chunks = 0;

  for (const document of documents) {
    const documentChunks = chunksForDocument(document).length;
    chunks += documentChunks;
    const existing =
      byType.get(document.sourceType) ?? {
        sourceType: document.sourceType,
        documents: 0,
        chunks: 0,
      };
    existing.documents += 1;
    existing.chunks += documentChunks;
    byType.set(document.sourceType, existing);
  }

  return {
    documents: documents.length,
    chunks,
    byType: Array.from(byType.values()).sort((left, right) =>
      left.sourceType.localeCompare(right.sourceType),
    ),
    sourceIds: documents.map(sourceIdForDocument),
  };
}

async function expectedCorpusSources(documents: SourceCorpusDocument[]) {
  return Promise.all(
    documents.map(async (document) => {
      const chunks = chunksForDocument(document);
      const contentHashes = await Promise.all(chunks.map(sha256Hex));
      return {
        sourceId: sourceIdForDocument(document),
        sourceType: document.sourceType,
        title: document.title,
        chunks: chunks.length,
        contentHashes,
      };
    }),
  );
}

function unknownFreshness(
  detail: string,
  documents: SourceCorpusDocument[] = sourceCorpus,
): SourceCorpusFreshness {
  const expected = getExpectedSourceCorpusStats(documents);
  return {
    status: "unknown",
    checkedAt: new Date().toISOString(),
    expectedDocuments: expected.documents,
    observedDocuments: 0,
    expectedChunks: expected.chunks,
    observedChunks: 0,
    observedIndexedChunks: 0,
    missingSourceIds: [],
    staleSourceIds: [],
    expectedByType: expected.byType,
    detail,
  };
}

export async function getSourceCorpusFreshness(
  env: Env,
  documents: SourceCorpusDocument[] = sourceCorpus,
): Promise<SourceCorpusFreshness> {
  const bindings = env as Partial<Env>;
  if (!bindings.DB) {
    return unknownFreshness("D1 binding is unavailable.", documents);
  }

  const expected = getExpectedSourceCorpusStats(documents);
  if (expected.sourceIds.length === 0) {
    return {
      status: "fresh",
      checkedAt: new Date().toISOString(),
      expectedDocuments: 0,
      observedDocuments: 0,
      expectedChunks: 0,
      observedChunks: 0,
      observedIndexedChunks: 0,
      missingSourceIds: [],
      staleSourceIds: [],
      expectedByType: [],
      detail: "No bundled source corpus documents are expected.",
    };
  }

  const expectedSources = await expectedCorpusSources(documents);
  const placeholders = expected.sourceIds.map(() => "?").join(", ");
  const rows = await bindings.DB.prepare(
    `select
      source_id as sourceId,
      chunk_index as chunkIndex,
      content_hash as contentHash,
      indexed_at as indexedAt
    from source_chunks
    where source_id in (${placeholders})
    order by source_id, chunk_index`,
  )
    .bind(...expected.sourceIds)
    .all<{
      sourceId: string;
      chunkIndex: number;
      contentHash: string;
      indexedAt: string | null;
    }>()
    .then((result) => result.results)
    .catch(() => null);

  if (!rows) {
    return unknownFreshness("D1 source freshness query failed.", documents);
  }

  const rowsBySource = new Map<string, typeof rows>();
  for (const row of rows) {
    rowsBySource.set(row.sourceId, [
      ...(rowsBySource.get(row.sourceId) ?? []),
      row,
    ]);
  }

  const missingSourceIds: string[] = [];
  const staleSourceIds: string[] = [];

  for (const source of expectedSources) {
    const sourceRows = rowsBySource.get(source.sourceId) ?? [];
    if (sourceRows.length === 0) {
      missingSourceIds.push(source.sourceId);
      continue;
    }

    const hasMissingChunks = sourceRows.length !== source.chunks;
    const hasUnindexedChunks = sourceRows.some((row) => !row.indexedAt);
    const hasContentDrift = source.contentHashes.some(
      (contentHash, chunkIndex) =>
        sourceRows.find((row) => Number(row.chunkIndex) === chunkIndex)
          ?.contentHash !== contentHash,
    );

    if (hasMissingChunks || hasUnindexedChunks || hasContentDrift) {
      staleSourceIds.push(source.sourceId);
    }
  }

  const status =
    missingSourceIds.length > 0
      ? "missing"
      : staleSourceIds.length > 0
        ? "stale"
        : "fresh";

  return {
    status,
    checkedAt: new Date().toISOString(),
    expectedDocuments: expected.documents,
    observedDocuments: rowsBySource.size,
    expectedChunks: expected.chunks,
    observedChunks: rows.length,
    observedIndexedChunks: rows.filter((row) => row.indexedAt).length,
    missingSourceIds,
    staleSourceIds,
    expectedByType: expected.byType,
    detail:
      status === "fresh"
        ? "Bundled GrowthRat proof and role source corpus is present and indexed."
        : `${missingSourceIds.length} bundled sources missing and ${staleSourceIds.length} stale.`,
  };
}

async function embedTexts(env: Env, values: string[]) {
  const embeddings: number[][] = [];

  for (let index = 0; index < values.length; index += maxEmbeddingBatchSize) {
    const batch = values.slice(index, index + maxEmbeddingBatchSize);
    const response = await env.AI.run(
      embeddingModel,
      {
        text: batch,
      },
      {
        gateway: {
          id: env.AI_GATEWAY_ID,
          collectLog: true,
          metadata: {
            product: "growthrat",
            operation: "source_embedding",
          },
        },
      },
    );

    const data = (response as { data?: unknown }).data;
    if (!Array.isArray(data)) return embeddings;
    embeddings.push(...(data as number[][]));
  }

  return embeddings;
}

function vectorInfoStats(info: unknown) {
  if (!info || typeof info !== "object") {
    return { vectorCount: null, vectorDimensions: null };
  }

  const record = info as Record<string, unknown>;
  const config =
    record.config && typeof record.config === "object"
      ? (record.config as Record<string, unknown>)
      : {};

  const vectorCount =
    typeof record.vectorsCount === "number"
      ? record.vectorsCount
      : typeof record.vectorCount === "number"
        ? record.vectorCount
        : null;
  const vectorDimensions =
    typeof config.dimensions === "number"
      ? config.dimensions
      : typeof record.dimensions === "number"
        ? record.dimensions
        : null;

  return { vectorCount, vectorDimensions };
}

export async function getSourceStats(env: Env): Promise<SourceStats> {
  const bindings = env as Partial<Env>;
  const [chunkRow, sourceRow, byTypeRows, vectorInfo, freshness] =
    await Promise.all([
    bindings.DB
      ? bindings.DB.prepare(
          "select count(*) as chunks, sum(case when indexed_at is not null then 1 else 0 end) as indexedChunks from source_chunks",
        )
          .first<{ chunks: number; indexedChunks: number }>()
          .catch(() => null)
      : Promise.resolve(null),
    bindings.DB
      ? bindings.DB.prepare(
          "select count(distinct source_id) as sources from source_chunks",
        )
          .first<{ sources: number }>()
          .catch(() => null)
      : Promise.resolve(null),
    bindings.DB
      ? bindings.DB.prepare(
          `select
            source_type as sourceType,
            count(distinct source_id) as sources,
            count(*) as chunks,
            sum(case when indexed_at is not null then 1 else 0 end) as indexedChunks
          from source_chunks
          group by source_type
          order by source_type`,
        )
          .all<{
            sourceType: string;
            sources: number;
            chunks: number;
            indexedChunks: number;
          }>()
          .then((result) => result.results)
          .catch(() => [])
      : Promise.resolve([]),
    bindings.DOC_INDEX ? bindings.DOC_INDEX.describe().catch(() => null) : null,
    getSourceCorpusFreshness(env).catch(() =>
      unknownFreshness("Source freshness check failed."),
    ),
  ]);

  const { vectorCount, vectorDimensions } = vectorInfoStats(vectorInfo);

  return {
    chunks: Number(chunkRow?.chunks ?? 0),
    indexedChunks: Number(chunkRow?.indexedChunks ?? 0),
    sources: Number(sourceRow?.sources ?? 0),
    vectorCount,
    vectorDimensions,
    freshness,
    byType: byTypeRows.map((row) => ({
      sourceType: row.sourceType,
      sources: Number(row.sources ?? 0),
      chunks: Number(row.chunks ?? 0),
      indexedChunks: Number(row.indexedChunks ?? 0),
    })),
  };
}

async function upsertVectors(env: Env, vectors: VectorizeVector[]) {
  for (let index = 0; index < vectors.length; index += maxVectorBatchSize) {
    await env.DOC_INDEX.upsert(vectors.slice(index, index + maxVectorBatchSize));
  }
}

async function writeDocumentSource(env: Env, document: SourceCorpusDocument) {
  const sourceId = sourceIdForDocument(document);
  const r2Key = `sources/${sourceId}.md`;

  await env.ARTIFACT_BUCKET.put(r2Key, document.content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      source_id: sourceId,
      source_type: document.sourceType,
      source_url: document.url,
    },
  });

  return { sourceId, r2Key };
}

export async function ingestSourceDocuments(
  env: Env,
  documents: SourceCorpusDocument[] = sourceCorpus,
) {
  const now = new Date().toISOString();
  let chunksWritten = 0;
  const vectorIds: string[] = [];

  for (const document of documents) {
    const { sourceId, r2Key } = await writeDocumentSource(env, document);
    const chunks = chunksForDocument(document);
    const embeddings = await embedTexts(env, chunks);

    if (embeddings.length !== chunks.length) {
      throw new Error(`embedding count mismatch for ${document.id}`);
    }

    const vectors: VectorizeVector[] = [];
    const rows: Array<{
      id: string;
      content: string;
      contentHash: string;
      vectorId: string;
      chunkIndex: number;
    }> = [];

    for (const [index, content] of chunks.entries()) {
      const contentHash = await sha256Hex(content);
      const id = `${sourceId}-${index}`;
      const vectorId = `src_${id}`;

      vectors.push({
        id: vectorId,
        namespace: sourceNamespace,
        values: embeddings[index],
        metadata: {
          source_id: sourceId,
          source_type: document.sourceType,
          title: document.title.slice(0, 180),
          url: document.url,
          chunk_index: index,
          retrieved_at: document.retrievedAt,
          content: content.slice(0, 2000),
        },
      });

      rows.push({
        id,
        content,
        contentHash,
        vectorId,
        chunkIndex: index,
      });
    }

    if (vectors.length > 0) {
      await upsertVectors(env, vectors);
      vectorIds.push(...vectors.map((vector) => vector.id));
    }

    const staleRows = await env.DB.prepare(
      "select vector_id from source_chunks where source_id = ? and chunk_index >= ?",
    )
      .bind(sourceId, rows.length)
      .all<{ vector_id: string }>();

    const staleVectorIds = staleRows.results.map((row) => row.vector_id);
    if (staleVectorIds.length > 0) {
      await env.DOC_INDEX.deleteByIds(staleVectorIds).catch(() => undefined);
    }

    const statements = [
      env.DB.prepare(
        `insert into sources (id, source_type, title, url, r2_key, retrieved_at, created_at)
        values (?, ?, ?, ?, ?, ?, ?)
        on conflict(id)
        do update set
          source_type = excluded.source_type,
          title = excluded.title,
          url = excluded.url,
          r2_key = excluded.r2_key,
          retrieved_at = excluded.retrieved_at`,
      ).bind(
        sourceId,
        document.sourceType,
        document.title,
        document.url,
        r2Key,
        now,
        now,
      ),
      ...rows.map((row) =>
        env.DB.prepare(
          `insert into source_chunks (
            id,
            source_id,
            source_type,
            title,
            url,
            chunk_index,
            content,
            content_hash,
            vector_id,
            indexed_at,
            created_at,
            updated_at
          ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(id)
          do update set
            source_type = excluded.source_type,
            title = excluded.title,
            url = excluded.url,
            content = excluded.content,
            content_hash = excluded.content_hash,
            vector_id = excluded.vector_id,
            indexed_at = excluded.indexed_at,
            updated_at = excluded.updated_at`,
        ).bind(
          row.id,
          sourceId,
          document.sourceType,
          document.title,
          document.url,
          row.chunkIndex,
          row.content,
          row.contentHash,
          row.vectorId,
          now,
          now,
          now,
        ),
      ),
      env.DB.prepare(
        "delete from source_chunks where source_id = ? and chunk_index >= ?",
      ).bind(sourceId, rows.length),
    ];

    await env.DB.batch(statements);
    chunksWritten += rows.length;
  }

  const receipt = {
    generatedAt: now,
    documents: documents.length,
    chunks: chunksWritten,
    vectorIds,
  };

  await env.ARTIFACT_BUCKET.put(
    `source-ingest/${now.replaceAll(":", "-")}.json`,
    JSON.stringify(receipt, null, 2),
    {
      httpMetadata: { contentType: "application/json" },
    },
  );

  return receipt;
}

export async function ensureSeedSourceCorpus(
  env: Env,
  documents: SourceCorpusDocument[] = sourceCorpus,
): Promise<SourceCorpusSyncResult> {
  const before = await getSourceCorpusFreshness(env, documents);

  if (before.status === "fresh" || before.status === "unknown") {
    return {
      ok: before.status === "fresh",
      refreshed: false,
      before,
      after: before,
      receipt: null,
    };
  }

  const sourceIdsToRefresh = new Set([
    ...before.missingSourceIds,
    ...before.staleSourceIds,
  ]);
  const targetedDocuments = documents.filter((document) =>
    sourceIdsToRefresh.has(sourceIdForDocument(document)),
  );
  const receipt = await ingestSourceDocuments(
    env,
    targetedDocuments.length > 0 ? targetedDocuments : documents,
  );
  const after = await getSourceCorpusFreshness(env, documents);

  return {
    ok: after.status === "fresh",
    refreshed: true,
    before,
    after,
    receipt,
  };
}

function docsPathToMarkdownUrl(path: string) {
  return `${revenueCatDocsBaseUrl}${path.replace(/\/+$/, "")}.md`;
}

function docsPathToUrl(path: string) {
  return `${revenueCatDocsBaseUrl}${path.replace(/\/+$/, "")}`;
}

export function parseRevenueCatDocsIndex(
  llmsText: string,
): RevenueCatDocsIndexEntry[] {
  const seen = new Set<string>();
  const entries: RevenueCatDocsIndexEntry[] = [];

  for (const line of llmsText.split("\n")) {
    const match = line.match(/^- (\/\S+)\s+-\s+(.+)$/);
    if (!match) continue;

    const path = match[1];
    if (seen.has(path)) continue;
    seen.add(path);

    entries.push({
      path,
      description: match[2].trim(),
      url: docsPathToUrl(path),
      markdownUrl: docsPathToMarkdownUrl(path),
    });
  }

  return entries;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<FetchTextResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1",
        "user-agent": "GrowthRat RevenueCat docs ingester",
      },
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      text: "",
      error: error instanceof Error ? error.message : "fetch failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isUsableMarkdown(text: string, contentType: string) {
  const trimmed = text.trimStart();
  if (trimmed.length < 100) return false;
  if (contentType.includes("text/markdown")) return true;

  const prefix = trimmed.slice(0, 120).toLowerCase();
  return (
    !prefix.startsWith("<!doctype") &&
    !prefix.startsWith("<html") &&
    !prefix.includes("404: not found")
  );
}

function frontmatterTitle(markdown: string) {
  const match = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match?.[1]?.trim() ?? "";
}

function documentForIndexOnlyEntry(
  entry: RevenueCatDocsIndexEntry,
  retrievedAt: string,
): SourceCorpusDocument {
  return {
    id: `rc-docs-${entry.path}`,
    sourceType: "revenuecat_docs",
    title: `RevenueCat Docs: ${entry.description}`,
    url: entry.url,
    retrievedAt,
    content: [
      `# ${entry.description}`,
      "",
      `RevenueCat documentation index entry: ${entry.path}`,
      "",
      "The Markdown mirror for this path was unavailable during ingestion, so GrowthRat stores this index entry as a searchable placeholder rather than inventing page content.",
      "",
      `Canonical URL: ${entry.url}`,
    ].join("\n"),
  };
}

async function documentForRevenueCatEntry(
  entry: RevenueCatDocsIndexEntry,
  retrievedAt: string,
) {
  const response = await fetchText(entry.markdownUrl);
  if (!response.ok || !isUsableMarkdown(response.text, response.contentType)) {
    return {
      document: documentForIndexOnlyEntry(entry, retrievedAt),
      fullMarkdown: false,
      status: response.status,
      error: response.error ?? `unusable markdown response (${response.status})`,
    };
  }

  return {
    document: {
      id: `rc-docs-${entry.path}`,
      sourceType: "revenuecat_docs" as const,
      title:
        frontmatterTitle(response.text) || `RevenueCat Docs: ${entry.description}`,
      url: entry.url,
      retrievedAt,
      content: response.text.trim(),
    },
    fullMarkdown: true,
    status: response.status,
    error: null,
  };
}

export async function fetchRevenueCatDocsIndex() {
  const response = await fetchText(revenueCatLlmsIndexUrl, 10000);
  if (!response.ok || !response.text.trim()) {
    throw new Error(
      `RevenueCat llms.txt fetch failed (${response.status || "network"})`,
    );
  }

  return parseRevenueCatDocsIndex(response.text);
}

export async function ingestRevenueCatDocsBatch(
  env: Env,
  options: RevenueCatDocsIngestOptions = {},
) {
  const startedAt = new Date().toISOString();
  const entries = await fetchRevenueCatDocsIndex();
  const cursor = clamp(Math.floor(Number(options.cursor ?? 0)), 0, entries.length);
  const batchSize = clamp(Math.floor(Number(options.batchSize ?? 8)), 1, 12);
  const selected = entries.slice(cursor, cursor + batchSize);
  let documents = 0;
  let chunks = 0;
  const fetches: Array<{
    path: string;
    markdownUrl: string;
    fullMarkdown: boolean;
    status: number;
    error: string | null;
    chunks: number;
  }> = [];

  for (const entry of selected) {
    const result = await documentForRevenueCatEntry(entry, startedAt);

    if (!result.fullMarkdown && options.includeIndexOnlyFallback === false) {
      fetches.push({
        path: entry.path,
        markdownUrl: entry.markdownUrl,
        fullMarkdown: false,
        status: result.status,
        error: result.error,
        chunks: 0,
      });
      continue;
    }

    let document = result.document;
    let fullMarkdown = result.fullMarkdown;
    let error = result.error;

    try {
      const receipt = await ingestSourceDocuments(env, [document]);
      documents += receipt.documents;
      chunks += receipt.chunks;
      fetches.push({
        path: entry.path,
        markdownUrl: entry.markdownUrl,
        fullMarkdown,
        status: result.status,
        error,
        chunks: receipt.chunks,
      });
    } catch (ingestError) {
      if (!result.fullMarkdown) {
        throw ingestError;
      }

      document = documentForIndexOnlyEntry(entry, startedAt);
      fullMarkdown = false;
      error =
        ingestError instanceof Error
          ? `full markdown ingest failed: ${ingestError.message}`
          : "full markdown ingest failed";

      const receipt = await ingestSourceDocuments(env, [document]);
      documents += receipt.documents;
      chunks += receipt.chunks;
      fetches.push({
        path: entry.path,
        markdownUrl: entry.markdownUrl,
        fullMarkdown,
        status: result.status,
        error,
        chunks: receipt.chunks,
      });
    }
  }

  const nextCursor = cursor + selected.length;
  const batchReceipt = {
    generatedAt: startedAt,
    corpus: "revenuecat_docs",
    cursor,
    batchSize,
    nextCursor: nextCursor < entries.length ? nextCursor : null,
    totalEntries: entries.length,
    attempted: selected.length,
    documents,
    chunks,
    fullMarkdown: fetches.filter((fetch) => fetch.fullMarkdown).length,
    indexOnly: fetches.filter((fetch) => !fetch.fullMarkdown).length,
    fetches,
  };

  await env.ARTIFACT_BUCKET.put(
    `source-ingest/revenuecat-docs-${startedAt.replaceAll(":", "-")}-${cursor}.json`,
    JSON.stringify(batchReceipt, null, 2),
    {
      httpMetadata: { contentType: "application/json" },
    },
  );

  return batchReceipt;
}

export function extractSourceSearchTerms(query: string) {
  const terms: string[] = [];

  for (const match of query.toLowerCase().matchAll(/[a-z0-9][a-z0-9-]{2,}/g)) {
    const term = match[0].replace(/^-+|-+$/g, "");
    if (term.length < 4 || lexicalStopWords.has(term)) continue;
    if (!terms.includes(term)) terms.push(term);
    if (terms.length >= 6) break;
  }

  return terms;
}

async function lexicalSourceSearch(env: Env, query: string, topK: number) {
  const terms = extractSourceSearchTerms(query);

  if (terms.length === 0) {
    const { results } = await env.DB.prepare(
      "select * from source_chunks where content like ? order by updated_at desc limit ?",
    )
      .bind("%RevenueCat%", topK)
      .all<SourceChunkRow>();

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      content: row.content,
      score: null,
    }));
  }

  const clauses = terms
    .map(() => "(lower(title) like ? or lower(content) like ?)")
    .join(" or ");
  const termParams = terms.flatMap((term) => [`%${term}%`, `%${term}%`]);

  const { results } = await env.DB.prepare(
    `select * from source_chunks
    where ${clauses}
    order by
      case when lower(title) like ? then 0 else 1 end,
      updated_at desc
    limit ?`,
  )
    .bind(...termParams, `%${terms[0]}%`, topK)
    .all<SourceChunkRow>();

  return results.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    content: row.content,
    score: null,
  }));
}

function dedupeSources(sources: RetrievedSource[], topK: number) {
  const seen = new Set<string>();
  const deduped: RetrievedSource[] = [];

  for (const source of sources) {
    const key = source.url || source.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
    if (deduped.length >= topK) break;
  }

  return deduped;
}

export async function retrieveSources(
  env: Env,
  query: string,
  topK = 4,
): Promise<RetrievedSource[]> {
  const lexicalSourcesPromise = lexicalSourceSearch(env, query, topK).catch(
    () => [] as RetrievedSource[],
  );
  const embeddings = await embedTexts(env, [query]);
  const queryVector = embeddings[0];
  if (!queryVector) return lexicalSourcesPromise;

  const matches = await env.DOC_INDEX.query(queryVector, {
    topK,
    namespace: sourceNamespace,
    returnMetadata: "all",
  });

  const ids = matches.matches.map((match) => match.id);
  if (ids.length === 0) return lexicalSourcesPromise;

  const placeholders = ids.map(() => "?").join(", ");
  const { results } = await env.DB.prepare(
    `select * from source_chunks where vector_id in (${placeholders})`,
  )
    .bind(...ids)
    .all<SourceChunkRow>();

  const rowsByVector = new Map(results.map((row) => [row.vector_id, row]));

  const vectorSources = matches.matches
    .map((match) => {
      const row = rowsByVector.get(match.id);
      if (!row) {
        const metadata = match.metadata ?? {};
        const content =
          typeof metadata.content === "string" ? metadata.content : "";
        const title =
          typeof metadata.title === "string" ? metadata.title : match.id;
        const url = typeof metadata.url === "string" ? metadata.url : null;
        return {
          id: match.id,
          title,
          url,
          content,
          score: match.score,
        };
      }

      return {
        id: row.id,
        title: row.title,
        url: row.url,
        content: row.content,
        score: match.score,
      };
    })
    .filter((source) => source.content.trim().length > 0);
  const lexicalSources = await lexicalSourcesPromise;

  return dedupeSources([...lexicalSources, ...vectorSources], topK);
}

export function sourceContextBlock(sources: RetrievedSource[]) {
  return sources
    .map((source, index) => {
      const url = source.url ? ` (${source.url})` : "";
      return `[${index + 1}] ${source.title}${url}\n${source.content}`;
    })
    .join("\n\n");
}
