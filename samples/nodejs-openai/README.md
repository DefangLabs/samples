# Node.js & OpenAI

## Setup

This sample requires an API key to access the OpenAI API. The name of the config value is referenced in the compose.yaml file.
To provide a value for it, you can use the Defang CLI like this:

```

defang config set --name OPENAI_KEY
```

and then enter the value when prompted.

## Testing

```
echo "Hello" | curl -H "Content-Type: text/plain" -d @- https://xxxxxxxx/prompt
```

or

```
cat prompt.txt | curl -H "Content-Type: application/text" -d @- https://xxxxxxxx/prompt
```

---

Title: Node.js & OpenAI

Short Description: A simple Node.js application that interacts with the OpenAI API

Tags: Node.js, Openai, API

Languages: Node.js
