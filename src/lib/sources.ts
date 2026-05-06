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
};

const embeddingModel = "@cf/baai/bge-base-en-v1.5";
const sourceNamespace = "revenuecat";
const maxChunkCharacters = 1400;

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

async function embedTexts(env: Env, values: string[]) {
  const response = await env.AI.run(
    embeddingModel,
    {
      text: values,
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
  return Array.isArray(data) ? (data as number[][]) : [];
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
  const [chunkRow, sourceRow, vectorInfo] = await Promise.all([
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
    bindings.DOC_INDEX ? bindings.DOC_INDEX.describe().catch(() => null) : null,
  ]);

  const { vectorCount, vectorDimensions } = vectorInfoStats(vectorInfo);

  return {
    chunks: Number(chunkRow?.chunks ?? 0),
    indexedChunks: Number(chunkRow?.indexedChunks ?? 0),
    sources: Number(sourceRow?.sources ?? 0),
    vectorCount,
    vectorDimensions,
  };
}

export async function ingestSourceDocuments(
  env: Env,
  documents: SourceCorpusDocument[] = sourceCorpus,
) {
  const now = new Date().toISOString();
  const vectors: VectorizeVector[] = [];
  const rows: Array<{
    id: string;
    sourceId: string;
    sourceType: string;
    title: string;
    url: string;
    chunkIndex: number;
    content: string;
    contentHash: string;
    vectorId: string;
  }> = [];

  for (const document of documents) {
    const sourceId = slug(document.id);
    const chunks = chunksForDocument(document);
    const embeddings = await embedTexts(env, chunks);

    if (embeddings.length !== chunks.length) {
      throw new Error(`embedding count mismatch for ${document.id}`);
    }

    for (const [index, content] of chunks.entries()) {
      const contentHash = await sha256Hex(content);
      const id = `${sourceId}-${index}`;
      const vectorId = `src_${id}`;

      rows.push({
        id,
        sourceId,
        sourceType: document.sourceType,
        title: document.title,
        url: document.url,
        chunkIndex: index,
        content,
        contentHash,
        vectorId,
      });

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
    }
  }

  if (vectors.length > 0) {
    await env.DOC_INDEX.upsert(vectors);
  }

  for (const row of rows) {
    await env.DB.prepare(
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
    )
      .bind(
        row.id,
        row.sourceId,
        row.sourceType,
        row.title,
        row.url,
        row.chunkIndex,
        row.content,
        row.contentHash,
        row.vectorId,
        now,
        now,
        now,
      )
      .run();

    await env.DB.prepare(
      `insert into sources (id, source_type, title, url, retrieved_at, created_at)
      values (?, ?, ?, ?, ?, ?)
      on conflict(id)
      do update set source_type = excluded.source_type, title = excluded.title, url = excluded.url, retrieved_at = excluded.retrieved_at`,
    )
      .bind(row.sourceId, row.sourceType, row.title, row.url, now, now)
      .run();
  }

  const receipt = {
    generatedAt: now,
    documents: documents.length,
    chunks: rows.length,
    vectorIds: rows.map((row) => row.vectorId),
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

async function fallbackSourceSearch(env: Env, query: string, topK: number) {
  const needle = `%${query
    .split(/\s+/)
    .filter((part) => part.length > 4)
    .slice(0, 3)
    .join("%")}%`;

  const { results } = await env.DB.prepare(
    "select * from source_chunks where content like ? order by updated_at desc limit ?",
  )
    .bind(needle === "%%" ? "%RevenueCat%" : needle, topK)
    .all<SourceChunkRow>();

  return results.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    content: row.content,
    score: null,
  }));
}

export async function retrieveSources(
  env: Env,
  query: string,
  topK = 4,
): Promise<RetrievedSource[]> {
  const embeddings = await embedTexts(env, [query]);
  const queryVector = embeddings[0];
  if (!queryVector) return fallbackSourceSearch(env, query, topK);

  const matches = await env.DOC_INDEX.query(queryVector, {
    topK,
    namespace: sourceNamespace,
    returnMetadata: "all",
  });

  const ids = matches.matches.map((match) => match.id);
  if (ids.length === 0) return fallbackSourceSearch(env, query, topK);

  const placeholders = ids.map(() => "?").join(", ");
  const { results } = await env.DB.prepare(
    `select * from source_chunks where vector_id in (${placeholders})`,
  )
    .bind(...ids)
    .all<SourceChunkRow>();

  const rowsByVector = new Map(results.map((row) => [row.vector_id, row]));

  return matches.matches
    .map((match) => {
      const row = rowsByVector.get(match.id);
      if (!row) {
        const metadata = match.metadata ?? {};
        const content =
          typeof metadata.content === "string" ? metadata.content : "";
        const title = typeof metadata.title === "string" ? metadata.title : match.id;
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
}

export function sourceContextBlock(sources: RetrievedSource[]) {
  return sources
    .map((source, index) => {
      const url = source.url ? ` (${source.url})` : "";
      return `[${index + 1}] ${source.title}${url}\n${source.content}`;
    })
    .join("\n\n");
}
