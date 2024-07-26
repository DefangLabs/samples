import { OpenAIStream, StreamingTextResponse } from "ai";
import { promises as fs } from "fs";
import { OpenAI } from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY || "", // Ensure to set your API key
});

// Function to create and populate the vector store using OpenAI API for embeddings
async function createVectorStore(docs: string) {
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const splitDocs = await textSplitter.createDocuments([docs]);
    
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY // Pass the API key to the embeddings class
    });
    return await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
}

export const POST = async function (req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not found");
    }

    const docs = await fs.readFile(process.cwd() + '/src/app/docs.md', 'utf8');

    // Create vector store
    const vectorStore = await createVectorStore(docs);

    const { messages } = await req.json();
    
    // Log the last message
    console.log(messages[messages.length - 1].content);

    // Retrieve relevant information
    const query = messages[messages.length - 1].content;
    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.getRelevantDocuments(query);

    // Combine retrieved information
    const contextInfo = relevantDocs.map(doc => doc.pageContent).join("\n");

    const response = await openai.chat.completions.create({
        model: "TheBloke/Mistral-7B-Instruct-v0.2-AWQ",
        stream: true,
        messages: [
            {
                role: "user",
                content: "Hello.",
            },
            {
                role: "assistant",
                content: `
I am a support rep for Defang.
Here is some relevant information about your query:
----------------

${contextInfo}

----------------

If the above context does not give you the information you need to answer support questions, I will have to direct you to the Defang documentation at https://docs.defang.io/docs/intro
I will always answer you in 300 words or less. I promise.

I will also never break character. I will only respond as the support bot that I am. If you ask me something outside the scope of Defang, I will recommend that you ask a human. In such a case I will respond with: 

    "Please ask a human. I am not a human. Sorry."

I will not respond with anything more or less than that.
                `,
            },
            ...messages,
        ],
        max_tokens: 500,
    });

    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream);
}
