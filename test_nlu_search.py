from api.natural_language_understanding import NaturalLanguageUnderstanding
import logging
import json
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def test_nlu_search():
    """Test the NLU search functionality"""
    print(f"BACKEND_URL is set to: {os.getenv('BACKEND_URL')}")
    
    # Initialize NLU
    nlu = NaturalLanguageUnderstanding()
    
    # Test queries
    test_queries = [
        "Tell me about energy",
        "What's happening with renewable energy?",
        "Latest news on artificial intelligence"
    ]
    
    for query in test_queries:
        print(f"\n=== Testing query: \"{query}\" ===")
        
        # Process the query
        try:
            result = nlu.process_query(query)
            
            # Print analysis
            print(f"Analysis: {json.dumps(result['analysis'], indent=2)}")
            
            # Print keywords
            print(f"Extracted keywords: {result['analysis'].get('keywords', [])}")
            
            # Check if articles were found
            if result['articles']:
                print(f"Found {len(result['articles'])} articles")
                for i, article in enumerate(result['articles']):
                    print(f"  Article {i+1}: {article.get('title', 'No title')} (ID: {article.get('id', 'No ID')})")
            else:
                print("No articles found")
                
            # Print response
            print(f"Response: {result['response']}")
            
        except Exception as e:
            print(f"Error processing query: {str(e)}")
    
    print("\nNLU search test completed")

if __name__ == "__main__":
    test_nlu_search() 