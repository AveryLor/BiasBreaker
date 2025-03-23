import requests
import json

BASE_URL = "http://localhost:8000"

def test_register():
    url = f"{BASE_URL}/users/"
    data = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    }
    response = requests.post(url, json=data)
    print(f"Register response status: {response.status_code}")
    print(f"Register response body: {response.json()}")
    return response.json()

def test_login():
    url = f"{BASE_URL}/token"
    data = {
        "username": "test@example.com",
        "password": "password123"
    }
    response = requests.post(url, data=data)
    print(f"Login response status: {response.status_code}")
    print(f"Login response body: {response.json()}")
    return response.json()

def test_get_user_info(token):
    url = f"{BASE_URL}/users/me"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Get user info response status: {response.status_code}")
    print(f"Get user info response body: {response.json()}")
    return response.json()

def test_search_history(token):
    url = f"{BASE_URL}/search-history/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Get search history response status: {response.status_code}")
    print(f"Get search history response body: {response.json()}")
    return response.json()

def run_tests():
    print("Testing user registration...")
    user = test_register()
    
    print("\nTesting user login...")
    token_info = test_login()
    token = token_info["access_token"]
    
    print("\nTesting get user info...")
    test_get_user_info(token)
    
    print("\nTesting get search history...")
    test_search_history(token)

if __name__ == "__main__":
    run_tests() 