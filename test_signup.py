import requests
import json

url = "http://localhost:8000/auth/signup"
payload = {
    "email": "test_debug_2@example.com",
    "password": "password123",
    "full_name": "Debug User",
    "company_name": "DebugCorp"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
