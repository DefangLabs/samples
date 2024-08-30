# Python & Flask & OpenAI

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-python-openai-template%26template_owner%3DDefangSamples)

## Setup

This sample requires an API key to access the OpenAI API. The name of the config value is referenced in the compose.yaml file. To provide a value for it, you can use the Defang CLI like this:

```
defang config set --name OPENAI_KEY
```

and then enter the value when prompted.

## Testing

```
echo "Hello" | curl -H "Content-Type: application/text" -d @- https://xxxxxxxx/prompt
```

or

```
cat prompt.txt | curl -H "Content-Type: application/text" -d @- https://xxxxxxxx/prompt
```

---

Title: Python & Flask & OpenAI

Short Description: An app that demonstrates how to use the OpenAI API with Python and Flask.

Tags: Python, Flask, OpenAI, AI, Python

Languages: python
