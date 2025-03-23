import os
import requests
import json
from dotenv import load_dotenv
import datetime
import sys

# Load environment variables
load_dotenv()

def test_search_history():
    # Base URL for the API
    base_url = "http://localhost:8000"
    
    # Get credentials from command line arguments or use defaults
    test_email = sys.argv[1] if len(sys.argv) > 1 else os.getenv("TEST_EMAIL", "test@example.com")
    test_password = sys.argv[2] if len(sys.argv) > 2 else os.getenv("TEST_PASSWORD", "password123")
    
    print("Testing search history functionality...")
    print(f"Using email: {test_email}")
    
    # Step a: Get authentication token
    print("\n1. Getting authentication token...")
    try:
        # Login data with provided or default credentials
        login_data = {"username": test_email, "password": test_password}
        print(f"Attempting login with: {login_data['username']}")
        
        token_response = requests.post(
            f"{base_url}/token",
            data=login_data
        )
        
        print(f"Response status code: {token_response.status_code}")
        print(f"Response headers: {token_response.headers}")
        
        if token_response.status_code != 200:
            print(f"Failed to authenticate: {token_response.status_code}")
            print(f"Response content: {token_response.text}")
            return
        
        token_data = token_response.json()
        token = token_data["access_token"]
        print(f"Authentication successful. Token: {token[:10]}...")
        
        # Step b: Test the search API endpoint
        print("\n2. Testing search API...")
        headers = {"Authorization": f"Bearer {token}"}
        search_data = {"topic": "Test search query"}
        
        print(f"Sending search request with headers: {headers}")
        print(f"Search data: {search_data}")
        
        try:
            search_response = requests.post(
                f"{base_url}/api/articles/search",
                json=search_data,
                headers=headers
            )
            
            print(f"Search response status code: {search_response.status_code}")
            
            # Print response content regardless of status code
            try:
                print(f"Response content: {search_response.json()}")
            except:
                print(f"Raw response content: {search_response.text}")
            
            if search_response.status_code != 200:
                print(f"Search failed: {search_response.status_code}")
                # Continue to check search history even if search fails
            else:
                print("Search request successful")
        except Exception as e:
            import traceback
            print(f"Error making search request: {e}")
            print(traceback.format_exc())
        
        # Step c: Check search history
        print("\n3. Checking search history...")
        history_response = requests.get(
            f"{base_url}/search-history/",
            headers=headers
        )
        
        print(f"History response status code: {history_response.status_code}")
        
        if history_response.status_code != 200:
            print(f"Failed to retrieve search history: {history_response.status_code}")
            print(f"Response content: {history_response.text}")
            return
        
        history_data = history_response.json()
        print(f"Retrieved {len(history_data)} search history records:")
        
        # Display the search history
        for item in history_data:
            print(f"ID: {item.get('id')} | Query: {item.get('query')} | Timestamp: {item.get('timestamp')}")
        
        print("\nSearch history test completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("==== Search History Test ====")
    print("Usage: python test_search_history.py [email] [password]")
    print("If email/password not provided, defaults or environment variables will be used.")
    print("============================")
    test_search_history() 