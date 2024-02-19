import {
	AstraDBVectorStore,
	AstraLibArgs,
} from "@langchain/community/vectorstores/astradb";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { TaskType } from "@google/generative-ai";
import { EmbeddingsInterface } from "@langchain/core/embeddings";

import dotenv from "dotenv";
import { Document, DocumentInterface } from "@langchain/core/documents";

dotenv.config();

export type MessageMetaData = {
	authorName: string;
	authorId: string;
	channelId: string;
	serverId: string;
};

const defaultConfig: AstraLibArgs = {
	token: process.env.ASTRA_DB_APPLICATION_TOKEN || "",
	endpoint: process.env.ASTRA_DB_API_ENDPOINT || "",
	collection: process.env.ASTRA_COLLECTION_NAME || "",
};

const defaultGoogleEmbeddings: EmbeddingsInterface =
	new GoogleGenerativeAIEmbeddings({
		modelName: "embedding-001",
		taskType: TaskType.RETRIEVAL_DOCUMENT,
	});

export class VectorChunkStore extends AstraDBVectorStore {
	config: AstraLibArgs;
	constructor(
		embeddings: EmbeddingsInterface = defaultGoogleEmbeddings,
		config: AstraLibArgs = defaultConfig
	) {
		super(embeddings, config);
		this.config = config;
	}

	async InsertMessageChunk(textBody: string, ids?: string[]) {
		const rec = await this.addDocuments(
			[
				new Document({
					pageContent: textBody,
					metadata: this.config,
				}),
			],
			ids
		);

		return rec;
	}

	async SearchMessageChunk(
		textBody: string,
		filters: MessageMetaData
	): Promise<DocumentInterface<Record<string, any>>[]> {
		const res = await this.similaritySearch(textBody, 3, filters);
		return res;
	}

	async EditMessageChunk(id: string, updatedText: string) {
		const res = await this.delete({ ids: [id] });
		await this.InsertMessageChunk(updatedText, [id]);
		return res;
	}
}
