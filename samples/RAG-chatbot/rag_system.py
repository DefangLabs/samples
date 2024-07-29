from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

knowledge_base = [
    {"id": 1, "text": "Python is a programming language that lets you work quickly and integrate systems more effectively."},
    {"id": 2, "text": "The Python Package Index (PyPI) is a repository of software for the Python programming language."},
    {"id": 3, "text": "Machine learning is a method of data analysis that automates analytical model building."},
    {"id": 4, "text": "Retrieval-Augmented Generation (RAG) is a hybrid model that combines retrieval and generation to answer questions."},
]

class SimpleRetriever:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base
        self.vectorizer = TfidfVectorizer().fit([doc["text"] for doc in knowledge_base])
        self.doc_vectors = self.vectorizer.transform([doc["text"] for doc in knowledge_base])

    def retrieve(self, query, top_k=2):
        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.doc_vectors).flatten()
        top_k_indices = similarities.argsort()[-top_k:][::-1]
        return [self.knowledge_base[idx] for idx in top_k_indices]

class SimpleGenerator:
    def generate(self, query, retrieved_docs):
        context = " ".join([doc["text"] for doc in retrieved_docs])
        return f"Based on the information available: {context} Your query was: {query}"

retriever = SimpleRetriever(knowledge_base)
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
