import os
import json
import logging
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
import requests
import dotenv

app = FastAPI()

# Load environment variables from .env file
dotenv.load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Set the endpoint URL for the chat model
# Here, we use the OpenAI API as an example:
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "https://api.openai.com/v1")

# Get the API key for the LLM
# For development, you can use your local API key. In production, you will need to configure your API key in the LLM gateway service.
def get_api_key():
    return os.getenv("OPENAI_API_KEY", "API key not set")

# Home page form
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <html>
        <head><title>Ask the Model</title></head>
        <body>
            <h1>Ask the Magic Backpack 🧙‍♂️🎒</h1>
            <form method="post" action="/ask">
                <textarea name="prompt" rows="5" cols="60" placeholder="Enter your question here..."></textarea><br><br>
                <input type="submit" value="Ask">
            </form>
        </body>
    </html>
    """

# Handle form submission
@app.post("/ask", response_class=HTMLResponse)
async def ask(prompt: str = Form(...)):
    headers = {
        "Content-Type": "application/json"
    }

    if not ENDPOINT_URL.startswith("http://localhost"):
        API_KEY = get_api_key()
        headers["Authorization"] = f"Bearer {API_KEY}"
    else:
        logging.info("Skipping Authorization header for localhost endpoint.")

    payload = {
        "model": os.getenv("MODEL", "gpt-4-turbo"),
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    # Log request details for debugging
    logging.info(f"Sending POST to {ENDPOINT_URL}")
    logging.info(f"Request Headers: {headers}")
    logging.info(f"Request Payload: {payload}")

    response = requests.post(f"{ENDPOINT_URL}/chat/completions", headers=headers, data=json.dumps(payload))

    if response.status_code == 200:
        data = response.json()
        try:
            reply = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            reply = "Model returned an unexpected response."
    else:
        # Log error details
        logging.error(f"Error from server: {response.status_code} - {response.text}")
        reply = f"Error: {response.status_code} - {response.text}"

    # Return result
    return f"""
    <html>
        <head><title>Ask the Model</title></head>
        <body>
            <h1>Ask the Magic Backpack 🧙‍♂️🎒</h1>
            <form method="post" action="/ask">
                <textarea name="prompt" rows="5" cols="60" placeholder="Enter your question here...">{prompt}</textarea><br><br>
                <input type="submit" value="Ask">
            </form>
            <hr>
            <h2>Model's Reply:</h2>
            <p>{reply}</p>
        </body>
    </html>
    """

@app.get("/health")
async def health():
    return {"status": "ok"}