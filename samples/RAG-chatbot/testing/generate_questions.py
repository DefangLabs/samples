import os
import openai
import subprocess

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Function to read all markdown files in a directory and subdirectories
def read_markdown_files(directory):
    content = ""
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".md") or file.endswith(".markdown"):
                with open(os.path.join(root, file), 'r') as f:
                    content += f.read() + "\n\n"
    return content

# Function to generate questions from the document content
def generate_questions_from_docs(docs_content, num_questions=10):
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are an AI that generates questions for testing based on the provided content."},
            {"role": "user", "content": f"Generate {num_questions} questions based on the following content:\n\n{docs_content}"}
        ],
        max_tokens=2048,
        n=num_questions,
        temperature=0.7
    )
    return [choice['message']['content'].strip() for choice in response.choices]

# Function to send questions via curl to the chatbot API
def test_questions_with_curl(questions):
    for question in questions:
        print(f"Testing question: {question}")
        # Use subprocess to execute curl command
        curl_command = f'curl -X POST http://localhost:5000/ask -H "Content-Type: application/json" -d \'{{"query": "{question}"}}\''
        response = subprocess.run(curl_command, shell=True, capture_output=True, text=True)
        print(f"Response: {response.stdout}\n")

if __name__ == "__main__":
    # Step 1: Read markdown files
    directory_path = "/Users/chris/Desktop/tmp"  # Replace with your actual directory
    docs_content = read_markdown_files(directory_path)

    # Step 2: Generate questions from the document content
    questions = generate_questions_from_docs(docs_content, num_questions=10)
    # Step 3: Test questions using curl
    test_questions_with_curl(questions)
