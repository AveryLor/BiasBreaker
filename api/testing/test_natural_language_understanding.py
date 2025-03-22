#!/usr/bin/env python
import os
import sys
import json
import argparse
from pprint import pprint

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from natural_language_understanding import NaturalLanguageUnderstanding

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test Natural Language Understanding API')
    parser.add_argument('--query', type=str, 
                        help='Query to analyze')
    return parser.parse_args()

def display_results(results):
    """Display the analysis results in a readable format."""
    print("\n" + "="*60)
    print("NATURAL LANGUAGE UNDERSTANDING RESULTS")
    print("="*60)
    
    if isinstance(results, dict):
        if 'topic' in results:
            print(f"\nTOPIC: {results['topic']}")
        
        if 'context' in results:
            print(f"\nCONTEXT: {results['context']}")
        
        if 'keywords' in results:
            print("\nKEYWORDS:")
            for i, keyword in enumerate(results['keywords'], 1):
                print(f"  {i}. {keyword}")
    else:
        print("\nRESULTS:")
        pprint(results)
    
    print("\n" + "="*60)

def main():
    """Main function to test the natural language understanding API."""
    args = parse_arguments()
    
    # Use provided query or a default if none provided
    query = args.query if args.query else "What are the latest developments in artificial intelligence and machine learning?"
    
    print(f"\nAnalyzing query: \"{query}\"")
    print("\nProcessing... (this may take a moment)")
    
    try:
        # Initialize the API class
        nlu = NaturalLanguageUnderstanding()
        
        # Call the API function
        results = nlu.process_query(query)
        
        # Display the results
        display_results(results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 