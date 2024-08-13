import re
import json
import os

# Function to reset knowledge_base.json
def reset_knowledge_base():
    with open('knowledge_base.json', 'w') as output_file:
        json.dump([], output_file)

def parse_markdown_file_to_json(file_path):
    # Initialize an empty list to accumulate content across multiple function calls
    try:
        # Try to load existing content if the file already exists
        with open('knowledge_base.json', 'r') as existing_file:
            json_output = json.load(existing_file)
            current_id = len(json_output) + 1  # Start ID from the next available number
    except FileNotFoundError:
        # If the file doesn't exist, start fresh
        json_output = []
        current_id = 1

    with open(file_path, 'r', encoding='ISO-8859-1') as file:
        markdown_content = file.read()
    
    # Split the content by headings
    sections = re.split(r'(?<=\n)(?=#)', markdown_content)  # Split by headings, keeping them attached

    for section in sections:
        lines = section.strip().split('\n', 1)
        if len(lines) > 1:
            heading = lines[0].strip()  # First line is the heading
            content = lines[1].strip().replace('\n', ' ')  # The rest is the content
        else:
            heading = lines[0].strip()
            content = ""

        # Remove markdown symbols from the heading
        sanitized_heading = re.sub(r'^#+\s*', '', heading)

        # Append to the json_output
        json_output.append({
            "id": current_id,
            "about": sanitized_heading,
            "text": content
        })
        current_id += 1

    # Write the augmented JSON output to knowledge_base.json
    with open('knowledge_base.json', 'w') as output_file:
        json.dump(json_output, output_file, indent=2)

def parse_cli_markdown(file_path):
    # Initialize an empty list to accumulate content across multiple function calls
    json_output = []
    current_id = 1

    # Check if the JSON file exists and is not empty
    if os.path.exists('knowledge_base.json') and os.path.getsize('knowledge_base.json') > 0:
        with open('knowledge_base.json', 'r') as existing_file:
            try:
                json_output = json.load(existing_file)
                current_id = len(json_output) + 1  # Start ID from the next available number
            except json.JSONDecodeError:
                # If there's an error in loading, assume starting fresh
                json_output = []
                current_id = 1

    with open(file_path, 'r', encoding='ISO-8859-1') as file:
        lines = file.readlines()

    # Extract the title from the metadata (assuming it's on line 2, index 1)
    title_line = lines[1].strip()
    title = re.sub(r'^title:\s*', '', title_line)

    # Extract the 'about' from the 5th line (index 4)
    about = lines[4].strip()

    # Start the text content with the sentence mentioning the command and title, adding backticks for emphasis
    text_intro = f"The command to {about} is ```{title}```."

    # Combine the rest of the lines into a single text block, excluding metadata and ignoring the last line if it starts with '######'
    content_lines = [line.strip() for line in lines[5:] if not line.startswith('######')]
    content = " ".join(content_lines)

    # Combine the intro and the rest of the content
    full_text = f"{text_intro} {content}"

    # Append to the json_output
    json_output.append({
        "id": current_id,
        "about": about,
        "text": full_text
    })

    # Write the augmented JSON output to knowledge_base.json
    with open('knowledge_base.json', 'w') as output_file:
        json.dump(json_output, output_file, indent=2)

def recursive_parse_directory(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if 'cli' in dirpath.lower():
                parse_cli_markdown(file_path)
            else:
                parse_markdown_file_to_json(file_path)

# Example usage:
reset_knowledge_base()  # Reset knowledge_base.json to empty at the start
recursive_parse_directory('/Users/chris/Desktop/tmp')
