import openai
import json
import os
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Ensure you have set the OPENAI_API_KEY in your environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")

class RAGSystem:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.doc_embeddings = self.embed_knowledge_base()

    def embed_knowledge_base(self):
        docs = [doc["text"] for doc in self.knowledge_base]
        return self.model.encode(docs, convert_to_tensor=True)

    def retrieve(self, query):
        query_embedding = self.model.encode([query], convert_to_tensor=True)
        similarities = cosine_similarity(query_embedding, self.doc_embeddings)
        most_similar_idx = np.argmax(similarities)
        return self.knowledge_base[most_similar_idx]["text"]

    def generate_response(self, query, context):
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": query},
                    {"role": "system", "content": context},
                ]
            )
            return response.choices[0].message['content']
        except Exception as e:
            print(f"Error generating response from OpenAI: {e}")
            raise

    def answer_query(self, query):
        try:
            context = self.retrieve(query)
            response = self.generate_response(query, context)
            return response
        except Exception as e:
            print(f"Error in answer_query: {e}")
            return f"An error occurred while generating the response: {e}"

# Load knowledge base from a JSON file
with open('knowledge_base.json', 'r') as kb_file:
    knowledge_base = json.load(kb_file)

rag_system = RAGSystem(knowledge_base)
