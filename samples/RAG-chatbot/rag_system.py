from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Initialize SBERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Knowledge base documents


knowledge_base = [
    {"id": 1, "text": "Defang is a radically simpler way for developers to build, deploy their apps to the cloud. Defang enables you to easily author cloud applications in any language, build and deploy to the cloud with a single command, and iterate quickly."},
    {"id": 2, "text": "The Defang CLI includes an AI-driven assistant that translates natural language prompts to an outline for your project that you can then refine."},
    {"id": 3, "text": "Defang can automatically build and deploy your project with a single command."},
    {"id": 4, "text": "You can deploy to the Defang Playground, a hosted environment to learn to use Defang with non-production workloads."},
    {"id": 5, "text": "Once ready, you can deploy it to your own cloud account with Defang BYOC, which takes care of configuring networking, security, observability, and other details."},
    {"id": 6, "text": "Defang allows publishing updates to your deployed application with zero downtime."},
    {"id": 7, "text": "Defang supports various types of applications: Web services and APIs, mobile app backends, ML services, hosting LLMs, etc."},
    {"id": 8, "text": "Defang supports your programming language of choice: Node.js, Python, Golang, or anything else you can package in a Dockerfile."},
    {"id": 9, "text": "Defang includes a built-in AI assistant to go from natural language prompt to an outline project."},
    {"id": 10, "text": "Defang supports automated Dockerfile builds."},
    {"id": 11, "text": "Defang supports pre-built Docker containers from public or private image registries."},
    {"id": 12, "text": "Defang allows expressing your project configuration using a Docker Compose YAML file."},
    {"id": 13, "text": "Defang can manage encrypted secrets and configuration."},
    {"id": 14, "text": "Defang provides pre-configured environments with built-in security, networking, and observability."},
    {"id": 15, "text": "Defang supports one-command deployments."},
    {"id": 16, "text": "Defang supports GPUs."},
    {"id": 17, "text": "Defang supports Infra-as-Code via the Defang Pulumi provider."},
    {"id": 18, "text": "To install the Defang CLI, you can use Homebrew, a bash script, or download the binary directly."},
    {"id": 19, "text": "To authenticate with Defang, run the command: defang login."},
    {"id": 20, "text": "Defang supports creating and deploying services to the cloud in various ways: creating an outline using AI, building and deploying your code, deploying existing containers, and deploying using Pulumi."},
    {"id": 21, "text": "You can view logs for all your services, one service, or even one specific deployment of a service from the CLI or the Defang Portal."},
    {"id": 22, "text": "To update your app, run the defang compose up command, which builds and deploys a new version with zero downtime."},
    {"id": 23, "text": "Defang supports deploying to AWS us-west-2 in the Defang Playground and to your chosen region in Defang BYOC."},
    {"id": 24, "text": "Defang supports deploying to AWS ECS. Using the Pulumi provider, it is possible to combine Defang services with other native AWS resources."},
    {"id": 25, "text": "You can access AWS resources such as S3 or RDS in the cloud account you are using as a Defang BYOC Provider."},
    {"id": 26, "text": "Defang plans to support other clouds such as Azure and GCP in future releases."},
    {"id": 27, "text": "Defang Playground is meant for testing and trial purposes only. Deployment of production apps with Defang BYOC is not yet supported."},
    {"id": 28, "text": "MacOS users will need to allow the Defang binary to run due to security settings. Attempt to run the binary, go to System Preferences > Privacy & Security > Security, and allow the binary to run."},
    {"id": 29, "text": "The message 'The folder is not empty. Files may be overwritten.' is displayed when you run defang generate and the target folder is not empty."},
    {"id": 30, "text": "The message 'environment variable not found' is displayed when you run defang compose up and the Compose file references an environment variable that is not set."},
    {"id": 31, "text": "The message 'Unsupported platform' is displayed when you run defang compose up and the Compose file references a platform that is not supported by Defang."},
    {"id": 32, "text": "The message 'not logged in' is displayed when you run defang compose config but you are not logged in."},
    {"id": 33, "text": "The message 'No port mode was specified; assuming host' is displayed when you run defang compose up and the Compose file declares a port without specifying a port mode."},
    {"id": 34, "text": "The message 'Published ports are not supported in ingress mode; assuming host' is displayed when you run defang compose up and the Compose file declares a port with mode set to ingress and published set to a port number."},
    {"id": 35, "text": "The message 'TCP ingress is not supported; assuming HTTP' is displayed when you run defang compose up and the Compose file declares a port with mode set to ingress and protocol set to tcp."},
    {"id": 36, "text": "The message 'unsupported compose directive' is displayed when you run defang compose up and the Compose file declares a directive that is not supported by Defang."},
    {"id": 37, "text": "The message 'no reservations specified; using limits as reservations' is displayed when you run defang compose up and the Compose file declares a resource with limits but no reservations."},
    {"id": 38, "text": "The message 'ingress port without healthcheck defaults to GET / HTTP/1.1' is displayed when you run defang compose up and the Compose file declares an ingress with a port but no healthcheck."},
    {"id": 39, "text": "The message 'missing memory reservation; specify deploy.resources.reservations.memory to avoid out-of-memory errors' is displayed when you run defang compose up and the Compose file doesn't specify a memory reservation."}
]

def get_embedding(text):
    return model.encode(text)

# Precompute embeddings for the knowledge base
document_embeddings = np.array([get_embedding(doc["text"]) for doc in knowledge_base])

class EmbeddingRetriever:
    def __init__(self, knowledge_base, document_embeddings):
        self.knowledge_base = knowledge_base
        self.document_embeddings = document_embeddings

    def retrieve(self, query, top_k=2):
        query_embedding = get_embedding(query).reshape(1, -1)
        similarities = cosine_similarity(query_embedding, self.document_embeddings).flatten()
        top_k_indices = similarities.argsort()[-top_k:][::-1]
        return [self.knowledge_base[idx] for idx in top_k_indices]

class SimpleGenerator:
    def generate(self, query, retrieved_docs):
        context = "\n".join([f"{idx + 1}. {doc['text']}" for idx, doc in enumerate(retrieved_docs)])
        return f"Based on the information available, here are the top results related to your query:\n{context}"

retriever = EmbeddingRetriever(knowledge_base, document_embeddings)
generator = SimpleGenerator()

class RAGSystem:
    def __init__(self, retriever, generator):
        self.retriever = retriever
        self.generator = generator

    def answer_query(self, query):
        retrieved_docs = self.retriever.retrieve(query)
        response = self.generator.generate(query, retrieved_docs)
        return response

rag_system = RAGSystem(retriever, generator)