import re
import json
import os

# Function to reset knowledge_base.json
def reset_knowledge_base():
    with open('knowledge_base.json', 'w') as output_file:
        json.dump([], output_file)

def parse_markdown_file_to_json(file_path):
    try:
        # Load existing content if the file exists
        with open('knowledge_base.json', 'r') as existing_file:
            json_output = json.load(existing_file)
            current_id = len(json_output) + 1  # Start ID from the next available number
    except (FileNotFoundError, json.JSONDecodeError):
        # If the file doesn't exist or is empty, start fresh
        json_output = []
        current_id = 1

    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Skip the first 5 lines
    markdown_content = "".join(lines[5:])

    # First pass: Determine headers for 'about' section
    sections = []
    current_section = {"about": [], "text": []}
    has_main_header = False

    for line in markdown_content.split('\n'):
        header_match = re.match(r'^(#{1,6}|\*\*+)\s+(.*)', line)  # Match `#`, `##`, ..., `######` and `**`
        if header_match:
            header_level = len(header_match.group(1).strip())
            header_text = header_match.group(2).strip()

            if header_level == 1 or header_match.group(1).startswith('**'):  # Treat `**` as a main header
                if current_section["about"] or current_section["text"]:
                    sections.append(current_section)
                current_section = {"about": [header_text], "text": []}
                has_main_header = True
            else:
                if has_main_header:
                    current_section["about"].append(header_text)
                else:
                    if header_level == 2:
                        if current_section["about"] or current_section["text"]:
                            sections.append(current_section)
                        current_section = {"about": [header_text], "text": []}
                    else:
                        current_section["about"].append(header_text)
        else:
            current_section["text"].append(line.strip())

    if current_section["about"] or current_section["text"]:
        sections.append(current_section)

    # Second pass: Combine text while ignoring headers and discard entries with empty 'about' or 'text'
    for section in sections:
        about = ", ".join(section["about"])
        text = " ".join(line for line in section["text"] if line)
        
        if about and text:  # Only insert if both 'about' and 'text' are not empty
            json_output.append({
                "id": current_id,
                "about": about,
                "text": text
            })
            current_id += 1

    # Write the augmented JSON output to knowledge_base.json
    with open('knowledge_base.json', 'w', encoding='utf-8') as output_file:
        json.dump(json_output, output_file, indent=2, ensure_ascii=False)

def parse_cli_markdown(file_path):
    try:
        # Load existing content if the file exists
        with open('knowledge_base.json', 'r') as existing_file:
            json_output = json.load(existing_file)
            current_id = len(json_output) + 1  # Start ID from the next available number
    except (FileNotFoundError, json.JSONDecodeError):
        # If the file doesn't exist or is empty, start fresh
        json_output = []
        current_id = 1

    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    if len(lines) < 5:
        print(f"File {file_path} does not have enough lines to parse.")
        return

    # Extract 'about' from the 5th line (index 4)
    about = lines[4].strip()

    # Combine all remaining lines after the first 5 lines into 'text'
    text_lines = lines[5:]
    text = "".join(text_lines).strip()

    # Only append if both 'about' and 'text' are not empty
    if about and text:
        json_output.append({
            "id": current_id,
            "about": about,
            "text": text
        })
        current_id += 1

    # Write the augmented JSON output to knowledge_base.json
    with open('knowledge_base.json', 'w', encoding='utf-8') as output_file:
        json.dump(json_output, output_file, indent=2, ensure_ascii=False)

def recursive_parse_directory(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if filename.lower().endswith('.md'):
                if 'cli' in dirpath.lower() or 'cli' in filename.lower():
                    parse_cli_markdown(file_path)
                else:
                    parse_markdown_file_to_json(file_path)

# Example usage:
if __name__ == "__main__":
    reset_knowledge_base()  # Reset knowledge_base.json to empty at the start
    recursive_parse_directory('/Users/chris/Desktop/tmp')  # Parse the entire directory
    print("Parsing completed successfully.")
