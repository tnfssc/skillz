import { Ai } from "@cloudflare/ai";

export interface EmbeddingResponse {
  shape: number[];
  data: number[][];
}

export async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const embeddings = (await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  })) as EmbeddingResponse;

  return embeddings.data[0];
}

export async function generateEmbeddings(ai: Ai, texts: string[]): Promise<number[][]> {
  const embeddings = (await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: texts,
  })) as EmbeddingResponse;

  return embeddings.data;
}
