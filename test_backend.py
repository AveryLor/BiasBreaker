import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_backend():
    """Test the FastAPI backend endpoints directly"""
    
    # Get the backend URL from environment variables
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
    print(f"Testing backend at: {backend_url}")
    
    # Test root endpoint
    try:
        print("\nTesting root endpoint...")
        response = requests.get(f"{backend_url}/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to backend: {str(e)}")
    
    # Test news endpoint
    try:
        print("\nTesting /news endpoint...")
        response = requests.get(f"{backend_url}/news")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            articles = response.json()
            print(f"Found {len(articles)} articles")
            if articles:
                sample = articles[0]
                print(f"Sample article fields: {', '.join(sample.keys())}")
                if 'news_information' in sample:
                    print(f"Sample news_information: {sample['news_information'][:100]}...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing news endpoint: {str(e)}")
    
    # Test search endpoint with a basic query
    try:
        print("\nTesting /search endpoint...")
        query = "energy"
        response = requests.get(f"{backend_url}/search?query={query}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            print(f"Found {len(results)} results for query '{query}'")
            if results:
                sample = results[0]
                print(f"Sample result fields: {', '.join(sample.keys())}")
                print(f"Sample title: {sample.get('source_name', 'N/A')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing search endpoint: {str(e)}")
    
    print("\nBackend test completed")

if __name__ == "__main__":
    test_backend() 