import json
import logging
import os

import requests
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure basic logging
logging.basicConfig(level=logging.INFO)

default_openai_base_url = "https://api.openai.com/v1/"

# Set the environment variables for the chat model
LLM_URL = os.getenv("LLM_URL", default_openai_base_url) + "chat/completions"
# Fallback to OpenAI Model if not set in environment
MODEL_ID = os.getenv("LLM_MODEL", "gpt-4-turbo")

# Get the API key for the LLM
# For development, you can use your local API key. In production, the LLM gateway service will override the need for it.
def get_api_key():
    return os.getenv("OPENAI_API_KEY", "")

# Home page form
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <html>
        <head>
            <title>Ask the AI Model</title>
            <script type="text/javascript" src="./static/app.js"></script>
        </head>
        <body>
            <h1>Ask the AI Model</h1>
            <form method="post" id="askForm" onsubmit="event.preventDefault(); submitForm(event);">
                <textarea id="prompt" name="prompt" autofocus="autofocus" rows="5" cols="60" placeholder="Enter your question here..."
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.dispatchEvent(new Event('submit', {cancelable:true}));}"></textarea>
                <br><br>
                <input type="submit" value="Ask">
            </form>
            <hr>
            <h2>Model's Reply:</h2>
            <p id="reply"></p>
        </body>
    </html>
    """

# Handle form submission
@app.post("/ask", response_class=JSONResponse)
async def ask(prompt: str = Form(...)):
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    reply = get_llm_response(payload)

    return {"prompt": prompt, "reply": reply}

def get_llm_response(payload):
    api_key = get_api_key()
    request_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # Log request details
    logging.info(f"Sending POST to {LLM_URL}")
    logging.info(f"Request Headers: {request_headers}")
    logging.info(f"Request Payload: {payload}")

    response = None
    try:
        response = requests.post(f"{LLM_URL}", headers=request_headers, data=json.dumps(payload))
    except requests.exceptions.HTTPError as errh:
        return f"HTTP error:", errh
    except requests.exceptions.ConnectionError as errc:
        return f"Connection error:", errc
    except requests.exceptions.Timeout as errt:
        return f"Timeout error:", errt
    except requests.exceptions.RequestException as err:
        return f"Unexpected error:", err

    if response is None:
        return f"Error: No response from server."
    if response.status_code == 400:
        return f"Connect Error: {response.status_code} - {response.text}"
    if response.status_code == 500:
        return f"Error from server: {response.status_code} - {response.text}"

    try:
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return "Model returned an unexpected response."
