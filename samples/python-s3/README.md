# Python & Flask & AWS S3

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-python-s3-template%26template_owner%3DDefangSamples)

This sample requires an API key to access AWS S3. The name of the config values is referenced in the compose.yaml file.
To provide a value for it, you can use the Defang CLI like this:

```
defang config set --name AWS_ACCESS_KEY
defang config set --name AWS_SECRET_KEY
```

and then enter the value when prompted.

## Testing

curl -X POST -H 'Content-Type: application/json' -d '{ "first_name" : "jane", "last_name" : "doe" }' https://xxxxxx/upload
curl https://xxxxxx/download

---

Title: Python & Flask & AWS S3

Short Description: An app that demonstrates how to upload and download files from AWS S3 using Python and Flask.

Tags: Python, Flask, AWS S3

Languages: python
