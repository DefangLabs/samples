import openai
import json
import os
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

# Ensure you have set the OPENAI_API_KEY in your environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")

class RAGSystem:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.doc_embeddings = self.embed_knowledge_base()

    def embed_knowledge_base(self):
        # Combine the 'about' and 'text' fields for embedding
        docs = [f'{doc["about"]}. {doc["text"]}' for doc in self.knowledge_base]
        return self.model.encode(docs, convert_to_tensor=True)

    def normalize_query(self, query):
        """
        Normalize the query by converting it to lowercase and stripping whitespace.
        """
        return query.lower().strip()

    def retrieve(self, query, similarity_threshold=0.7, high_match_threshold=0.8, max_docs=5):
        # Normalize query
        normalized_query = self.normalize_query(query)
        print(f"Retrieving context for query: '{normalized_query}'")

        # Query embedding
        query_embedding = self.model.encode([normalized_query], convert_to_tensor=True)

        # Calculate similarities
        similarities = cosine_similarity(query_embedding, self.doc_embeddings)[0]

        # Initialize relevance scores
        relevance_scores = []

        for i, doc in enumerate(self.knowledge_base):
            # Calculate about and text similarities separately
            about_similarity = cosine_similarity(query_embedding, self.model.encode([doc["about"]]))[0][0]
            text_similarity = similarities[i]  # Already calculated
            
            # Give more weight to text similarity
            combined_score = (0.3 * about_similarity) + (0.7 * text_similarity)
            
            # If either about or text similarity is above the high match threshold, prioritize it
            if about_similarity >= high_match_threshold or text_similarity >= high_match_threshold:
                combined_score = max(about_similarity, text_similarity)
                
            relevance_scores.append((i, combined_score))

        # Sort by combined score in descending order
        sorted_indices = sorted(relevance_scores, key=lambda x: x[1], reverse=True)
        top_indices = [i for i, score in sorted_indices[:max_docs] if score >= similarity_threshold]

        # Retrieve the most relevant documents, including both 'about' and 'text' fields
        retrieved_docs = [f'{self.knowledge_base[i]["about"]}. {self.knowledge_base[i]["text"]}' for i in top_indices]

        if not retrieved_docs:
            max_index = np.argmax(similarities)
            retrieved_docs.append(f'{self.knowledge_base[max_index]["about"]}. {self.knowledge_base[max_index]["text"]}')

        context = "\n\n".join(retrieved_docs)
        print("Retrieved Context:\n", context)

        return context

    def generate_response(self, query, context):
        # Normalize query
        normalized_query = self.normalize_query(query)
        print(f"Generating response for query: '{normalized_query}'")

        try:
            prompt = (
                "You are a dedicated assistant designed to provide positive answers about Defang. "
                "When the user says 'you', 'your', or any pronoun, interpret it as referring to Defang with context of Defang also. "
                "If the user's question involves comparisons with or references to other services, you may use external knowledge. "
                "However, if the question is strictly about Defang, you must ignore all external knowledge and only utilize the given context. "
                "When generating the answer, please put the answer first and the justification later. "
                "Any mentions of BYOD means BRING YOUR OWN DOMAIN and NOT BRING YOUR OWN DEVICE."
                "Your objective is to remain strictly within the confines of the given context unless comparisons to other services are explicitly mentioned. "
                "Although this rarely happens, if the prompt is not related to defang reply with prompt out of scope. If the prompt contains the word `defang` proceed with answering"
                "\n\nContext:\n" + context + "\n\n"
                "User Question: " + query + "\n\n"
                "Answer:"
            )

            response = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": normalized_query}
                ],
                temperature=0.05,
                max_tokens=2048,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )

            # Print the response generated by the model
            generated_response = response['choices'][0]['message']['content'].strip()

            print("Generated Response:\n", generated_response)

            return generated_response

        except openai.error.OpenAIError as e:
            print(f"Error generating response from OpenAI: {e}")
            return "An error occurred while generating the response."

    def answer_query(self, query):
        try:
            # Normalize query before use
            normalized_query = self.normalize_query(query)
            context = self.retrieve(normalized_query)
            response = self.generate_response(normalized_query, context)
            return response
        except Exception as e:
            print(f"Error in answer_query: {e}")
            return "An error occurred while generating the response."

# Load knowledge base from a JSON file
with open('knowledge_base.json', 'r') as kb_file:
    knowledge_base = json.load(kb_file)

rag_system = RAGSystem(knowledge_base)
