import requests

print("Ollama ko call kar raha hoon, thora wait karo...")

try:
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:1b",
            "prompt": "Hello! Tum kaun ho?",
            "stream": False
        },
        timeout=60
    )
    print("Status Code:", response.status_code)
    print("Raw Response:", response.text)

except Exception as e:
    print("ERROR AAYA:", e)