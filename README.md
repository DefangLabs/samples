# Defang Samples

Samples to show you how to develop, deploy, and debug cloud applications with Defang.

Browse through the [./samples](./samples) directory, or search and browse in the [docs](https://docs.defang.io/docs/samples).

## Adding Samples

To start working on a new sample, run `. ./scripts/new-sample` from the root of the repository. This will create a new sample directory, with some basic scaffolding to get you started. Look for `#REMOVE_ME_AFTER_EDITING` in your new project to look for things that you should probably be changing/checking per sample. Feel free to remove files, like `compose.dev.yaml` if they aren't necessary for your sample.

### Testing Samples

When you add a new sample, make sure to add any config vals to the `deploy-changed-samples.yml` workflow. They need to be prefixed with `TEST_` and those values need to be set in the repo secrets. **NOTE** at the moment test break if we have a config value that only shows up in string interpolation in a longer string, for example in `ENV_NAME: proto://user:${PASSWORD}@host` if `PASSWORD` only ever shows up in that longer string, it will break the test. A workaround is to just add a line with `PASSWORD:` in the environment section, so the test can pick it up. Ugly, but works for now.

<!-- SAMPLES_LIST_START -->
## Available Samples

| Sample | Description | Tags | Languages |
|--------|-------------|------|-----------|
| [Agentic Autogen](./samples/agentic-autogen) | An Autogen agent application using Mistral and FastAPI, deployed with Defang. | Agent, Autogen, Mistral, FastAPI, Vite, React, Python, JavaScript, AI | Python, JavaScript |
| [Agentic LangGraph](./samples/agentic-langgraph) | A LangGraph Agent application that can use tools, deployed with Defang. | Agent, LangGraph, LangChain, AI, OpenAI, Tavily | TypeScript |
| [Agentic Strands](./samples/agentic-strands) | A Strands Agent application, deployed with Defang. | Python, Flask, Strands, AI, Agent | Python |
| [Angular & Node.js](./samples/angular-express) | A full-stack application using Angular for the frontend and Node.js with Socket.IO for the backend, containerized with Docker. | Angular, Node.js, Socket.IO, TypeScript, JavaScript | nodejs |
| [Arduino Flask Wifi Server](./samples/arduino-wifi) | An Arduino wifi server built with Flask. | Arduino, Flask, Python, IoT, Wifi, Serial | python |
| [BullMQ & BullBoard & Redis](./samples/bullmq-bullboard-redis) | A sample project with BullMQ, BullBoard, and Redis. | BullMQ, BullBoard, Redis, Express, Node.js, Message Queue, JavaScript | nodejs |
| [Crew.ai Django Sample](./samples/crew-django-redis-postgres) | A sample application that uses Crew.ai to summarize text in a background task, streamed to the user in real-time. | Django, Celery, Redis, Postgres, AI, ML | Python |
| [C# & ASP.NET Core](./samples/csharp-dotnet) | A simple task manager application using C# and ASP.NET Core. | ASP.NET Core, JavaScript, C# | C# |
| [Django](./samples/django) | A simple Django app that uses SQLite as the database. | Django, SQLite, Python | python |
| [Django Celery](./samples/django-celery) | A Django application that uses Celery for background tasks, Postgres as the database, and Redis as the message broker. | Django, Celery, Postgres, Redis | python, sql |
| [Django Channels & Redis & Postgres](./samples/django-channels-redis-postgres) | A basic configuration of Django Channels with Redis and Postgres demonstrating a simple chat application. | Django, Channels, Redis, Postgres, Chat, Application | Python |
| [Django & PostgreSQL](./samples/django-postgres) | A customer relationship management list project developed using the Python Django framework, offering a starting point to help you quickly build your customer management system. | Django, PostgreSQL, Python, SQL | python |
| [Django](./samples/django-railpack) | A simple Django app that uses SQLite as the database. | Django, SQLite, Python, Railpack | python |
| [Elysia & Bun](./samples/elysia) | A basic Elysia app running on Bun with Defang. | Bun, Elysia, TypeScript, JavaScript | nodejs |
| [FastAPI](./samples/fastapi) | A sample project demonstrating how to deploy FastAPI with Defang. | FastAPI, OpenAPI, Python | python |
| [FastAPI & PostgreSQL](./samples/fastapi-postgres) | A sample project with FastAPI and PostgreSQL. | FastAPI, PostgreSQL, Python, SQL | python |
| [FastAPI Postgres Pub/Sub](./samples/fastapi-postgres-pubsub) | FastAPI sample that stores messages in Postgres and streams them to two app instances via LISTEN/NOTIFY. | FastAPI, PostgreSQL, WebSockets, PubSub | Python, SQL |
| [Feathers.js](./samples/feathersjs) | A sample project demonstrating how to deploy a Feathers.js application using Defang. The application displays "DefangxFeathersjs" on the webpage. | Feathers.js, Node.js, JavaScript | nodejs |
| [Flask](./samples/flask) | A basic Flask to-do app. | Flask, Python | python |
| [Flask](./samples/flask-railpack) | A basic Flask to-do app. | Flask, Python, Railpack | python |
| [Go HTTP Server](./samples/golang-http) | A simple Go application that echoes back the request. | Go, HTTP | golang |
| [Go HTTP Form](./samples/golang-http-form) | A simple Go application that demonstrates form submission using the net/http library. | Go, HTTP | golang |
| [Go HTTP Form](./samples/golang-http-form-railpack) | A simple Go application that demonstrates form submission using the net/http library. | Go, HTTP, Railpack | golang |
| [Go & MongoDB](./samples/golang-mongodb) | A simple Go application that manages tasks with MongoDB. | Go, MongoDB, Atlas, Task Manager | golang |
| [Go & OpenAI](./samples/golang-openai) | A simple Go application that interacts with the OpenAI API. | Go, OpenAI, ChatGPT | golang |
| [Go & REST API](./samples/golang-rest-api) | A simple Go application that fetches fiscal data from an API. | Go, HTTP, Fiscal Data, REST API | golang |
| [Go & S3](./samples/golang-s3) | A simple Go application that uploads and downloads files from AWS S3. | Go, S3, AWS | golang |
| [Go & Slack API](./samples/golang-slackbot) | A simple Slackbot that posts messages to a Slack channel. | Go, Slack, Bot | golang |
| [Google ADK](./samples/google-adk) | A simple sample demonstrating how to deploy agents build with Google ADK to Defang. | Google ADK, Python, Agents | python |
| [Hasura & PostgreSQL](./samples/hasura) | A sample project demonstrating how to deploy Hasura with Defang and connect it to a PostgreSQL database. | Hasura, GraphQL, PostgreSQL, Database | SQL, GraphQL |
| [HTML & CSS & JavaScript](./samples/html-css-js) | A simple HTML, CSS and JavaScript website running on Defang. | HTML, CSS, JavaScript, Frontend | nodejs |
| [Huginn](./samples/huginn) | A system for building agents that perform automated tasks for you online. | Huginn, Agents, Automation | Dockerfile |
| [ImgProxy](./samples/imgproxy) | A fast and secure standalone server for resizing and converting remote images | Imgproxy, Images, Server | N/A |
| [Javalin](./samples/javalin) | A short hello world application demonstrating how to deploy Javalin onto Defang. | Javalin, Java, Maven | java |
| [Jupyter & Postgres](./samples/jupyter-postgres) | This sample shows you how to spin up a postgres database and a Jupyter notebook server. | Jupyter, Postgres, Database | Python, SQL |
| [LangChain & Flask](./samples/langchain) | A sample project demonstrating how to deploy LangChain with Flask on Defang. | LangChain, Flask, AI, Python | python |
| [Managed LLM](./samples/managed-llm) | An app using Managed LLMs with Defang's OpenAI Access Gateway. | LLM, OpenAI, Python, Bedrock, Vertex | Python |
| [Managed LLM with Docker Model Provider](./samples/managed-llm-provider) | An app using Managed LLMs with a Docker Model Provider, deployed with Defang. | LLM, Python, Bedrock, Vertex, Docker Model Provider | Python |
| [Mastra & Next.js](./samples/mastra-nextjs) | An AI-powered tool for chatting with GitHub repositories using Mastra and Google Gemini. | AI, GitHub, Mastra, Next.js, PostgreSQL, TypeScript | TypeScript, JavaScript, Docker |
| [Model Context Protocol (MCP) Chatbot](./samples/mcp) | An MCP (Model Context Protocol) chatbot assistant built with Next.js, Python, and Anthropic Claude. | MCP, Next.js, Python, Quart, Claude, AI, Anthropic, TypeScript, React, JavaScript | nodejs, python |
| [Metabase & PostgreSQL](./samples/metabase) | A simple Metabase configuration with a PostgreSQL database. | Metabase, PostgreSQL, Analytics, Database | SQL |
| [n8n](./samples/n8n) | A n8n app running on Defang. | n8n, PostgreSQL, Docker | Docker, Shell |
| [Next.js](./samples/nextjs) | A basic Next.js app. | Next.js, React, Docker, Node.js, TypeScript, JavaScript, Static | nodejs |
| [Next.js Blog](./samples/nextjs-blog) | A starter project developed using Next.js designed to make it easy to launch a blog. | Next.js, Blog, Node.js, React, MDX, TypeScript, JavaScript | nodejs |
| [Next.js & Claude](./samples/nextjs-claude) | A fun chatbot created with Next.js and Claude. | Next.js, TypeScript, React, JavaScript, Chatbot, Claude, AI, Anthropic | TypeScript |
| [Next.js CV](./samples/nextjs-cv) | A Next.js web app that displays a minimalist CV. | Next.js, React, TypeScript, JavaScript | nodejs |
| [Nextra](./samples/nextjs-documentation) | A documentation starter project developed using Nextra designed to streamline the creation of your documentation. | Next.js, Documentation, Nextra, Knowledgebase, Node.js, JavaScript, TypeScript | nodejs |
| [Next.js & Postgres](./samples/nextjs-postgres) | A sample Next.js application that uses Postgres as a database. | Next.js, Postgres, Database, Node.js | TypeScript, JavaScript |
| [Next.js](./samples/nextjs-railpack) | A basic Next.js app. | Next.js, React, Node.js, TypeScript, JavaScript, Static, Railpack | nodejs |
| [NocoDB](./samples/nocodb) | An open source alternative to AirTable. | NocoDB | Dockerfile |
| [Node.js & SocketIO](./samples/nodejs-chatroom) | A minimal chat application that shows how to use Socket.IO with Node.js. | Node.js, Chat, Socket.IO, JavaScript | nodejs |
| [Node.js & Express](./samples/nodejs-express) | A Node.js application that inspects and displays detailed information about incoming HTTP requests. | Node.js, Express, HTTP, Request, Inspector, JavaScript | nodejs |
| [Node.js Express Form](./samples/nodejs-form) | A Node.js application that handles form submissions using the Express framework. | Node.js, Express, HTTP, JavaScript | nodejs |
| [Node.js HTTP Server](./samples/nodejs-http) | A simple Node.js application that creates an HTTP server. | Node.js, HTTP, Server | nodejs |
| [Node.js & OpenAI](./samples/nodejs-openai) | A simple Node.js application that interacts with the OpenAI API. | Node.js, OpenAI, API, JavaScript | nodejs |
| [Node.js & React & PostgreSQL](./samples/nodejs-react-postgres) | A full-stack to-do list application. | Node.js, React, Full-stack, PostgreSQL, JavaScript, SQL | nodejs |
| [Node.js & REST API](./samples/nodejs-rest-api) | A simple Node.js application that creates a REST API and fetches data from the U.S. Department of the Treasury's Fiscal Data API. | Node.js, REST API, JavaScript | nodejs |
| [Node.js & S3](./samples/nodejs-s3) | A simple Node.js application that uploads and downloads files from AWS S3. | Node.js, S3, AWS, JavaScript | nodejs |
| [Nounly](./samples/nounly) | A URL shortener website built with Go, JavaScript, and Redis. | Go, JavaScript, Redis, URL shortener | golang, javascript |
| [Ollama](./samples/ollama) | Ollama is a tool that lets you easily run large language models. | AI, LLM, ML, Llama, Mistral, Next.js, AI SDK, | Typescript |
| [Phoenix & PostgreSQL](./samples/phoenix-postgres) | A sample Phoenix application that uses a PostgreSQL database. | Phoenix, PostgreSQL, Database, Elixir | Elixir |
| [Platformatic](./samples/platformatic) | A sample project showcasing a simple Platformatic service with Docker deployment. | Platformatic, Defang, Docker, Node.js, Service, JavaScript | nodejs |
| [Pulumi](./samples/pulumi) | A basic Pulumi example. | Pulumi, Node.js, HTTP, Server, TypeScript | nodejs |
| [Pulumi & Remix & PostgreSQL](./samples/pulumi-remix-postgres) | A full-stack example using Remix, Prisma, and Aiven. | Full-stack, Remix, Prisma, Aiven, PostgreSQL, Pulumi, Node.js, TypeScript, SQL | nodejs |
| [Python & Form](./samples/python-form) | A short Python example for form submission in Flask. | Python, Flask, Form | python |
| [Python & Implicit & GPU](./samples/python-implicit-gpu) | A Music Recommendation API that provides artist recommendations based on collaborative filtering using the ALS algorithm from the Implicit library, leveraging a GPU. | Music, Recommendation, API, Collaborative Filtering, Implicit, GPU, Python | python |
| [Python & Flask & HTTP](./samples/python-minimal) | A Flask application that inspects and returns detailed information about HTTP requests. | Flask, HTTP, Python | python |
| [Python & Flask & OpenAI](./samples/python-openai) | An app that demonstrates how to use the OpenAI API with Python and Flask. | Python, Flask, OpenAI, AI, Python | python |
| [Python & REST API](./samples/python-rest-api) | A Flask application that fetches average interest rates from the Fiscal Data Treasury API. | Flask, REST API, Python | python |
| [Python & Flask & AWS S3](./samples/python-s3) | An app that demonstrates how to upload and download files from AWS S3 using Python and Flask. | Python, Flask, AWS, S3 | python |
| [Ruby on Rails](./samples/rails) | A basic member list project developed using Ruby on Rails. | Ruby, Rails | Ruby |
| [React](./samples/react) | A minimal React app running on Defang. | React, Vite, JavaScript, Frontend | JavaScript |
| [React](./samples/react-vite-railpack) | A minimal React app running on Defang. | React, Vite, JavaScript, Frontend, Railpack | JavaScript |
| [Redis & JavaScript](./samples/redis-js) | A Redis and JavaScript application, deployed with Defang. | Redis, JavaScript | JavaScript |
| [Rocket](./samples/rocket) | A simple Rocket app. | Rocket | Rust |
| [Sails.js](./samples/sailsjs) | A short hello world application demonstrating how to deploy Sails.js onto Defang. | Sails.js, Node.js | nodejs |
| [Sails.js & PostgreSQL](./samples/sailsjs-postgres) | A sample project demonstrating how to deploy a project with PostgreSQL and Sails.js. | PostgreSQL, Sails.js, SQL, JavaScript | nodejs |
| [Svelte & Node.js & MySQL](./samples/svelte-mysql) | A full-stack application using Svelte for the frontend, Node.js for the backend, and MySQL for the database. | Svelte, Node.js, MySQL, Full-stack, JavaScript, TypeScript, SQL | nodejs |
| [SvelteKit](./samples/sveltekit) | A minimal SvelteKit app running on Defang. | SvelteKit, TypeScript, JavaScript, Svelte, Node.js, Frontend, TypeScript, JavaScript | nodejs |
| [SvelteKit & MongoDB](./samples/sveltekit-mongodb) | A full-stack application using SvelteKit for the frontend and MongoDB for the database. | SvelteKit, MongoDB, Full-stack, Node.js, JavaScript | nodejs |
| [Mistral & vLLM](./samples/vllm) | Deploy Mistral with a custom UI using vLLM. | Mistral, vLLM, AI, Nextjs, GPU, Node.js, TypeScript, JavaScript | nodejs |
| [Vue.js](./samples/vuejs) | A minimal Vue.js app running on Defang. | Vue.js, Vite, Node.js, Frontend, JavaScript | nodejs |

*This list is auto-generated. Run `node scripts/generate-samples-list.js` to update.*
<!-- SAMPLES_LIST_END -->
