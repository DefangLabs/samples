## Setup

This sample requires an API key to access AWS S3. The name of the config value is referenced in the compose.yaml file.
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

Title: Node.js & S3

Short Description: A simple Node.js application that uploads and downloads files from AWS S3

Tags: nodejs, s3, aws

Languages: nodejs
