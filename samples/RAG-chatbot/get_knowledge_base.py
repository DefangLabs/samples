import os
import json
import markdown
from bs4 import BeautifulSoup
from tqdm import tqdm
from markdown.extensions import extra

# Function to get all markdown and mdx files in a directory recursively
def get_markdown_and_mdx_files(directory):
    markdown_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.md') or file.endswith('.mdx'):
                markdown_files.append(os.path.join(root, file))
    return markdown_files

# Function to scrape content from a markdown or mdx file
def scrape_markdown_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        markdown_content = f.read()

    # Convert markdown/mdx to HTML
    html_content = markdown.markdown(markdown_content, extensions=['extra'])

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract relevant content from the HTML
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    paragraphs = soup.find_all('p')
    lists = soup.find_all(['ul', 'ol'])
    code_blocks = soup.find_all('code')

    # Concatenate headings, paragraphs, list items, and code blocks to form the content
    content = "\n".join(
        [heading.get_text() for heading in headings] +
        [para.get_text() for para in paragraphs] +
        ["\n".join([li.get_text() for li in lst.find_all('li')]) for lst in lists] +
        [code.get_text() for code in code_blocks]
    )

    return content

# Main function to process all markdown and mdx files and save content to JSON
def process_markdown_directory(directory):
    markdown_files = get_markdown_and_mdx_files(directory)
    
    knowledge_base = []
    for idx, file_path in enumerate(tqdm(markdown_files, desc="Processing Markdown and MDX Files")):
        content = scrape_markdown_content(file_path)
        knowledge_base.append({"id": idx + 1, "text": content})

    # Save the extracted content to a JSON file
    with open('knowledge_base.json', 'w', encoding='utf-8') as f:
        json.dump(knowledge_base, f, indent=4, ensure_ascii=False)

# Example usage
directory_path = '/Users/chris/Documents/GitHub/defang-docs'
process_markdown_directory(directory_path)
