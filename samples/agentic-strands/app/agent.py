from strands import Agent, tool
from strands.models.openai import OpenAIModel
from flask import Flask, request, jsonify, send_from_directory
import requests

import json
import os
import time
import dotenv
from threading import Lock

dotenv.load_dotenv()

message = """
You are an expert fashion stylist. Your goal is to help users find their personal style. 
Your task is to provide fashion advice and offer products based on the user's preferences.
You can use the tools available to you to assist with this.
Note that for any prompts you ask the user, make sure you actually explicitly state the question you are asking, and possible some sample answers so they know what to type. 
Keep the questions as simple as possible so the user doesn't have to type much. And don't ask more than 3 questions.
"""

app = Flask(__name__)
latest_response = {"message": "Hello! I'm your fashion stylist assistant. How can I help you with your style today?"}

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
    # print(json.dumps(kwargs["message"], indent=2)) # Debugging line

    # Extract the assistant's text message
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
def search_for_fashion_books(query, filters=None) -> str:
    """
    Search for detailed information about fashion books using the Open Library API.

    Args:
        query: The search term to look up fashion-related books.

    Returns:
        A string summarizing the list of matching books, or a message if none are found.
    """

    # Replace spaces in the query with plus signs for URL encoding
    clean_query = query.replace(' ', '+')

    url = f"https://openlibrary.org/search.json"
    headers = {}
    params = {
        "q": clean_query,
        "subject": "fashion",
        "page": 1,
        "limit": 10
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.ok:
            book_list = response.json()
            if book_list.get("num_found", 0) == 0:
                return "No fashion books found"

            message = "Here are the fashion books I found:"
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
    "name": "search_for_fashion_books",
    "description": "Get detailed information about fashion books from Open Library, based on a search query.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query for fashion books",
            }
        },
        "required": ["query"],
    },
}

agent = Agent(
    tools=[search_for_fashion_books], 
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

        # # Return the response from latest_response
        response_content = latest_response.get("message", "I'm thinking about your question...")

        return jsonify({
            "response": response_content
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in /chat endpoint: {str(e)}")
        return jsonify({"error": str(e), "response": str(e)}), 500

# Start Flask server when this script is run directly
if __name__ == '__main__':

    print("Environment variables:")
    print(f"- LLM_URL: {os.getenv('LLM_URL')}")
    
    print("Starting Flask server on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
