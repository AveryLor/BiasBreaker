from api.natural_language_understanding import NaturalLanguageUnderstanding
import json
import requests
import os
import sys

def check_backend_status():
    """Check if the FastAPI backend is running."""
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
    
    try:
        response = requests.get(f"{backend_url}/")
        if response.status_code == 200:
            print(f"Backend is running at {backend_url}")
            return True
        else:
            print(f"Backend responded with status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"Failed to connect to backend at {backend_url}. Is the server running?")
        return False
    except Exception as e:
        print(f"Error checking backend status: {str(e)}")
        return False

def test_nlu():
    # First, check if the backend is running
    if not check_backend_status():
        print("Backend is not available. Please start the backend server with:")
        print("python backend/main.py")
        sys.exit(1)
    
    # Initialize the NLU module
    nlu = NaturalLanguageUnderstanding()
    
    # Test with a specific query that should find matches in the news_information column
    # Based on the screenshot, "test article" should match the first entry
    query = "Tell me about the test article"
    
    print(f"Processing query: {query}")
    result = nlu.process_query(query)
    
    # Pretty print the result
    print("\nResults:")
    print(json.dumps(result, indent=2))
    
    # Print the keywords that were used for search
    print(f"\nKeywords used: {result['analysis']['keywords']}")
    
    # Print the number of articles found
    print(f"Articles found: {len(result['articles'])}")
    
    # Print article titles
    if result['articles']:
        print("\nArticle titles:")
        for i, article in enumerate(result['articles'], 1):
            print(f"{i}. {article['title']}")
            print(f"   Summary: {article['summary']}")
            print(f"   Relevance: {article['relevance']}")
    else:
        print("\nNo articles found. This could be because:")
        print("1. The Supabase database doesn't have the 'news' table")
        print("2. The table exists but contains no data")
        print("3. No articles matched the search keywords")
        print("\nCheck the backend server output for more details.")
    
    # Print the response
    print(f"\nResponse: {result['response']}")

if __name__ == "__main__":
    test_nlu() 