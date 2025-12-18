import requests
import json
import time

URL = "http://localhost:8000/chatbot"

payload = {
    "message": "INFORMATION REGARDING FERTILIZER BAGS?",
    "session_id": f"test_session_{int(time.time())}"
}

headers = {
    "Content-Type": "application/json"
}

print("🔄 Sending request to Flask server...\n")

response = requests.post(
    URL,
    headers=headers,
    data=json.dumps(payload),
    timeout=120
)

print("✅ Status Code:", response.status_code)
print("\n📩 Raw Response:\n", response.text)

if response.status_code == 200:
    data = response.json()
    print("\n🤖 AgroShakti Response:\n")
    print(data.get("response", "No response field found"))
