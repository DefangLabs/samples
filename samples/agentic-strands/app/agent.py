from strands import Agent, tool
from strands.models.openai import OpenAIModel
from flask import Flask, request, jsonify, send_from_directory
import requests

import os
import dotenv

dotenv.load_dotenv()

message = """
You are a helpful library assistant. 
Your goal is to help users discover books available through the library's book API, based on the user's preferences. 
When a user makes a request, you should search the API and suggest books that match their query. 

When interacting, ask the user clear questions to guide the search. 
Make sure to explicitly state the question you are asking, 
and provide simple sample answers so the user knows what to type.
Keep it to a maximum of 3 simple questions.
"""

app = Flask(__name__)
latest_response = {"message": "Hello! I'm your library assistant. How can I help you with your reading today?"}

model = OpenAIModel(
    client_args={
        "base_url": os.getenv("LLM_URL"),
        # "api_key": os.getenv("OPENAI_API_KEY")
    },
    model_id=os.getenv("LLM_MODEL"),
    params={
        "max_tokens": 1000,
        "temperature": 0.7,
    }
)

def parse_assistant_response(**kwargs):
    # Extract the assistant's text message from JSON
    assistant_text = kwargs["message"]["content"][0]["text"]

    print("Assistant Text: ", assistant_text)
    return assistant_text


def message_buffer_handler(**kwargs):
    # When a new message is created from the assistant, print its content
    global latest_response
    try:
        if "message" in kwargs and kwargs["message"].get("role") == "assistant":
            # Parse the assistant's response from JSON
            assistant_text = parse_assistant_response(**kwargs)

            # Send the assistant's message content back to the UI
            latest_response = {"message": assistant_text}

            # Prevent the agent from closing by not calling exit() or any termination logic here.
            # If you have any cleanup or state reset, do it here, but do not terminate the process.
            pass

    except Exception as e:
        print(f"Error in message_buffer_handler: {str(e)}")

@tool
def search_for_books(query, filters=None) -> str:
    """
    Search for detailed information about books using the Open Library API.

    Args:
        query: The search term to look up books.

    Returns:
        A string summarizing the list of matching books, or a message if none are found.
    """

    # Replace spaces in the query with plus signs for URL encoding
    clean_query = query.replace(' ', '+')

    url = f"https://openlibrary.org/search.json"
    headers = {}
    params = {
        "q": clean_query,
        "page": 1,
        "limit": 10
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.ok:
            book_list = response.json()
            if book_list.get("num_found", 0) == 0:
                return "No books found matching your query."

            message = "Here are the books I found:"
            for book in book_list.get("docs", []):
                title = book.get("title")
                author = book.get("author_name", ["Unknown"])[0]
                year = book.get("first_publish_year")
                message += f"\n- Title: {title}, Author: {author}, Year: {year}"
            print(message)
            return message
        else:
            return f"Error: API request failed: {response.status_code}"
    except Exception as e:
        return f"Error: {str(e)}"

TOOL_SPEC = {
    "name": "search_for_books",
    "description": "Get detailed information about books from Open Library, based on a search query.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query for books",
            }
        },
        "required": ["query"],
    },
}

agent = Agent(
    tools=[search_for_books], 
    model=model, 
    callback_handler=message_buffer_handler, 
    system_prompt=message
)

print("Agent model:", agent.model.config)

# Flask routes
@app.route('/')
def index():
    # This assumes index.html is in the same directory as this script
    return send_from_directory('.', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        global latest_response
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        user_message = data.get('message')
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        print(f"Received message: {user_message}")

        agent(f"Continue the conversation with the user. The user says: {user_message}")

        response_content = latest_response.get("message", "I'm thinking about your question...")

        return jsonify({
            "response": response_content
        })
    
    except Exception as e:
        print(f"Error in /chat endpoint: {str(e)}")
        return jsonify({"error": str(e), "response": str(e)}), 500

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "AI Library Assistant is running"}


# Start Flask server when this script is run directly
if __name__ == '__main__':

    print("Environment variables:")
    print(f"- LLM_URL: {os.getenv('LLM_URL')}")
    
    print("Starting Flask server on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
