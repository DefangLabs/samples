import requests
from bs4 import BeautifulSoup
import json
import time
from tqdm import tqdm

# URL of the sitemap
sitemap_url = "https://docs.defang.io/sitemap.xml"

# Function to get all URLs from the sitemap
def get_sitemap_urls(sitemap_url):
    response = requests.get(sitemap_url)
    soup = BeautifulSoup(response.content, features="xml")
    urls = [loc.get_text() for loc in soup.find_all('loc')]
    return urls

# Function to scrape content from a webpage
def scrape_content(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Example: Extracting paragraphs from the webpage
    paragraphs = soup.find_all('p')
    content = " ".join([para.get_text() for para in paragraphs])

    return content

# Get all URLs from the sitemap
urls = get_sitemap_urls(sitemap_url)

# Scrape content from all URLs
knowledge_base = []
for idx, url in enumerate(tqdm(urls, desc="Scraping URLs")):
    content = scrape_content(url)
    knowledge_base.append({"id": idx + 1, "text": content})
    time.sleep(1)  # To prevent overwhelming the server

# Save the scraped content to a JSON file
with open('knowledge_base.json', 'w') as f:
    json.dump(knowledge_base, f, indent=4)
