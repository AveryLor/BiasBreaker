import requests
import json
import sys

def test_search(query):
    """
    Test the search endpoint directly.
    """
    backend_url = "http://localhost:8000"
    
    # Check if backend is running
    try:
        response = requests.get(f"{backend_url}/")
        if response.status_code == 200:
            print(f"Backend is running at {backend_url}")
        else:
            print(f"Backend responded with status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"Failed to connect to backend at {backend_url}. Is the server running?")
        return False
    
    # Test the search endpoint
    try:
        print(f"Searching for: {query}")
        response = requests.get(f"{backend_url}/search?query={query}")
        
        if response.status_code != 200:
            print(f"Error: Search endpoint returned status code {response.status_code}")
            return False
            
        articles = response.json()
        print(f"Found {len(articles)} articles matching '{query}'")
        
        if articles:
            print("\nMatching articles:")
            for i, article in enumerate(articles, 1):
                print(f"{i}. {article.get('source_name', 'No title')}")
                
                # Print a snippet of the news_information
                news_info = article.get('news_information', '')
                snippet = news_info[:200] + "..." if len(news_info) > 200 else news_info
                print(f"   Content: {snippet}")
        else:
            print("No matching articles found")
            
        return True
    except Exception as e:
        print(f"Error testing search endpoint: {str(e)}")
        return False

if __name__ == "__main__":
    # Default query using text that appears in the screenshot
    query = "This is a test article"
    if len(sys.argv) > 1:
        query = sys.argv[1]
    
    test_search(query) 