import os
import json
import logging
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
import requests

app = FastAPI()

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Set the environment variables for the chat model
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "https://api.openai.com/v1/chat/completions")
# Fallback to OpenAI Model if not set in environment
MODEL_ID = os.getenv("MODEL", "gpt-4-turbo")

# Get the API key for the LLM
# For development, you can use your local API key. In production, the LLM gateway service will override the need for it.
def get_api_key():
    return os.getenv("OPENAI_API_KEY", "API key not set")

# Home page form
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <html>
        <head><title>Ask the AI Model</title></head>
        <body>
            <h1>Ask the AI Model</h1>
            <form method="post" action="/ask" onsubmit="document.getElementById('loader').style.display='block'">
                <textarea name="prompt" autofocus="autofocus" rows="5" cols="60" placeholder="Enter your question here..." 
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.submit();}">
                </textarea>
                <br><br>
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

    api_key = get_api_key()
    headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    # Log request details
    logging.info(f"Sending POST to {ENDPOINT_URL}")
    logging.info(f"Request Headers: {headers}")
    logging.info(f"Request Payload: {payload}")

    response = None
    reply = None
    try:
        response = requests.post(f"{ENDPOINT_URL}", headers=headers, data=json.dumps(payload))
    except requests.exceptions.HTTPError as errh:
        reply = f"HTTP error:", errh
    except requests.exceptions.ConnectionError as errc:
        reply = f"Connection error:", errc
    except requests.exceptions.Timeout as errt:
        reply = f"Timeout error:", errt
    except requests.exceptions.RequestException as err:
        reply = f"Unexpected error:", err

    if response is not None:
        # logging.info(f"Response Status Code: {response.status_code}")
        # logging.info(f"Response Headers: {response.headers}")
        # logging.info(f"Response Body: {response.text}")
        if response.status_code == 200:
            data = response.json()
            try:
                reply = data["choices"][0]["message"]["content"]
            except (KeyError, IndexError):
                reply = "Model returned an unexpected response."
        elif response.status_code == 400:
            reply = f"Connect Error: {response.status_code} - {response.text}"
        elif response.status_code == 500:
            reply = f"Error from server: {response.status_code} - {response.text}"
        else:
            # Log error details
            reply = f"Error from server: {response.status_code} - {response.text}"
            logging.error(f"Error from server: {response.status_code} - {response.text}")

    # Return result
    return f"""
    <html>
        <head><title>Ask the AI Model</title></head>
        <body>
            <h1>Ask the AI Model</h1>
            <form method="post" action="/ask" onsubmit="document.getElementById('loader').style.display='block'">
                <textarea name="prompt" autofocus="autofocus" rows="5" cols="60" placeholder="Enter your question here..."
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){{event.preventDefault();this.form.submit();}}"></textarea><br><br>
                <input type="submit" value="Ask">
            </form>
            <h2>You Asked:</h2>
            <p>{prompt}</p>
            <hr>
            <h2>Model's Reply:</h2>
            <p>{reply}</p>
        </body>
    </html>
    """
