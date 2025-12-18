from flask import Flask, request, jsonify
from flask_cors import CORS
from llama_cpp import Llama
import time

# -------------------------------
# Flask App Setup
# -------------------------------
app = Flask(__name__)
CORS(app)  # allow Node.js to call Flask

# -------------------------------
# Prompt Template
# -------------------------------
alpaca_prompt = """Below is an instruction that describes a task.

### Instruction:
You are AgroShakti, an AI-powered agricultural assistant created to help Indian farmers.
You are an expert in agriculture, farming schemes, crop management, soil health, irrigation,
pest and disease control, weather-based advisories, and government programs such as KCC.

# Follow these rules strictly:
# 1. Provide accurate, practical, and farmer-friendly advice.
# 2. Use simple language that is easy for farmers to understand.
# 3. Explain concepts step by step.
# 4. Give examples, best practices, and precautions.
# 5. Respond in detail (minimum 500 words).


Always respond as AgroShakti with a supportive tone.

### Question:
{question}

### Answer:
"""
# Follow these rules strictly:
# 1. Provide accurate, practical, and farmer-friendly advice.
# 2. Use simple language that is easy for farmers to understand.
# 3. Explain concepts step by step.
# 4. Give examples, best practices, and precautions.
# 5. Respond in detail (minimum 500 words).
# 6. Do NOT provide medical, legal, or veterinary advice.
# 7. Do NOT give unsafe chemical dosages.
# 8. If unsure, clearly say so.
# 9. Do not give any mobile or phone number.

# -------------------------------
# Load LLM ONCE (IMPORTANT)
# -------------------------------
print("🔄 Loading LLaMA model...")

llm = Llama(
    model_path="models/meta-llama-3.1-8b.Q4_K_M.gguf",
    n_ctx=4096,
    n_threads=8,
    n_batch=256,
    use_mmap=True,
    verbose=False
)

print("✅ Model loaded successfully")

# -------------------------------
# Health Check
# -------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "llama-3.1-8b"})


# -------------------------------
# CHATBOT ENDPOINT
# -------------------------------
@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        data = request.get_json()

        message = data.get("message")
        session_id = data.get("session_id", f"session_{int(time.time())}")

        if not message:
            return jsonify({
                "success": False,
                "error": "Message is required"
            }), 400

        prompt = alpaca_prompt.format(question=message)

        output = llm(
            prompt,
            max_tokens=800,
            temperature=0.7,
            top_p=0.9,
            repeat_penalty=1.05,
            stop=["### Instruction:", "### Question:"]
        )

        response_text = output["choices"][0]["text"].strip()

        return jsonify({
            "success": True,
            "response": response_text,
            "session_id": session_id,
            "model": "meta-llama-3.1-8b"
        })

    except Exception as e:
        print("❌ Chatbot Error:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )
