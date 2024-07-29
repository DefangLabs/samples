from transformers import DPRQuestionEncoder, RagTokenizer, RagSequenceForGeneration

# Define model names
dpr_model_name = "facebook/dpr-question_encoder-single-nq-base"
rag_model_name = "facebook/rag-sequence-nq"

# Download DPRQuestionEncoder model
print(f"Downloading {dpr_model_name}...")
dpr_model = DPRQuestionEncoder.from_pretrained(dpr_model_name)
dpr_model.save_pretrained(f"./models/{dpr_model_name}")
print(f"Model {dpr_model_name} downloaded and saved.")

# Download RagTokenizer model
print(f"Downloading {rag_model_name} tokenizer...")
rag_tokenizer = RagTokenizer.from_pretrained(rag_model_name)
rag_tokenizer.save_pretrained(f"./models/{rag_model_name}")
print(f"Tokenizer {rag_model_name} downloaded and saved.")

# Download RagSequenceForGeneration model
print(f"Downloading {rag_model_name}...")
rag_model = RagSequenceForGeneration.from_pretrained(rag_model_name)
rag_model.save_pretrained(f"./models/{rag_model_name}")
print(f"Model {rag_model_name} downloaded and saved.")
