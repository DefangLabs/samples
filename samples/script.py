import os
import yaml
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def find_environment_variables(directory):
    env_vars = {}
    for root, _, files in os.walk(directory):
        for file in sorted(files):
            if file.endswith('.yaml') or file.endswith('.yml'):
                file_path = os.path.join(root, file)
                logging.info(f"Processing file: {file_path}")
                with open(file_path, 'r') as stream:
                    try:
                        data = yaml.safe_load(stream)
                        # Check if 'services' key exists
                        if data and 'services' in data:
                            for service, config in sorted(data['services'].items()):
                                # Check if 'environment' exists for each service
                                if 'environment' in config:
                                    env_vars[file_path] = env_vars.get(file_path, {})
                                    env_vars[file_path][service] = config['environment']
                    except yaml.YAMLError as exc:
                        logging.error(f"Error parsing {file_path}: {exc}")
    return env_vars

if __name__ == "__main__":
    directory = './'
    env_vars = find_environment_variables(directory)
    for file_path, services in env_vars.items():
        print(f"File: {file_path}")
        for service, env in services.items():
            print(f"  Service: {service}")
            print(f"  Environment Variables: {env}")
        print()
