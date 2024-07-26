from flask import Flask, request, jsonify, render_template
from transformers import RagTokenizer, RagRetriever, RagSequenceForGeneration

app = Flask(__name__)

# Load tokenizer, retriever, and model
tokenizer = RagTokenizer.from_pretrained("facebook/rag-sequence-nq")
retriever = RagRetriever.from_pretrained("facebook/rag-sequence-nq")
model = RagSequenceForGeneration.from_pretrained("facebook/rag-sequence-nq")

# Read the README file
with open('app/readme.md', 'r') as file:
    readme_content = file.read()

# Split the content into chunks
def split_into_chunks(text, chunk_size=512):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

readme_chunks = split_into_chunks(readme_content)

# Index the README chunks
retriever.index.index_data({
    "id": [str(i) for i in range(len(readme_chunks))],
    "text": readme_chunks,
    "title": ["README"] * len(readme_chunks)
})

# Define a function to retrieve and generate a response
def generate_response(question):
    input_ids = tokenizer(question, return_tensors="pt").input_ids
    generated_ids = model.generate(input_ids=input_ids)
    return tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    question = request.json['question']
    response = generate_response(question)
    return jsonify({'response': response})
