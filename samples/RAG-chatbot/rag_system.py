from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json

# Load the knowledge base from the JSON file
with open('knowledge_base.json', 'r') as f:
    knowledge_base = json.load(f)

# Initialize SBERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text):
    return model.encode(text)

# Precompute embeddings for the knowledge base
document_embeddings = np.array([get_embedding(doc["text"]) for doc in knowledge_base])

class EmbeddingRetriever:
    def __init__(self, knowledge_base, document_embeddings):
        self.knowledge_base = knowledge_base
        self.document_embeddings = document_embeddings

    def retrieve(self, query, top_k=2):
        query_embedding = get_embedding(query).reshape(1, -1)
        similarities = cosine_similarity(query_embedding, self.document_embeddings).flatten()
        top_k_indices = similarities.argsort()[-top_k:][::-1]
        return [self.knowledge_base[idx] for idx in top_k_indices]

class SimpleGenerator:
    def generate(self, query, retrieved_docs):
        context = "\n".join([f"{idx + 1}. {doc['text']}" for idx, doc in enumerate(retrieved_docs)])
        return f"Based on the information available, here are the top results related to your query:\n{context}"

retriever = EmbeddingRetriever(knowledge_base, document_embeddings)
generator = SimpleGenerator()

class RAGSystem:
    def __init__(self, retriever, generator):
        self.retriever = retriever
        self.generator = generator

    def answer_query(self, query):
        retrieved_docs = self.retriever.retrieve(query)
        response = self.generator.generate(query, retrieved_docs)
        return response

rag_system = RAGSystem(retriever, generator)
