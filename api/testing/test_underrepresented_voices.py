#!/usr/bin/env python
import os
import sys
import json
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from underrepresented_voices import UnderrepresentedVoices

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test Underrepresented Voices API')
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--title', type=str, help='Article title')
    group.add_argument('--file', type=str, help='JSON file containing article data')
    
    parser.add_argument('--body', type=str, help='Article body content')
    
    return parser.parse_args()

def display_results(article, results):
    """Display the analysis results in a readable format."""
    print("\n" + "="*80)
    print("UNDERREPRESENTED VOICES ANALYSIS RESULTS")
    print("="*80)
    
    print(f"\nARTICLE TITLE: {article['title']}")
    print("-" * 80)
    print(article['body'][:300] + "..." if len(article['body']) > 300 else article['body'])
    print("-" * 80)
    
    if 'underrepresented' in results:
        if 'segments' in results['underrepresented']:
            print("\nUNDERREPRESENTED SEGMENTS:")
            for i, segment in enumerate(results['underrepresented']['segments'], 1):
                print(f"  {i}. {segment}")
        
        if 'demographics' in results['underrepresented']:
            print("\nUNDERREPRESENTED DEMOGRAPHICS:")
            for i, demographic in enumerate(results['underrepresented']['demographics'], 1):
                print(f"  {i}. {demographic}")
    
    if 'recommendations' in results:
        print("\nRECOMMENDATIONS:")
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"  {i}. {rec}")
    
    print("\n" + "="*80)

def load_sample_article():
    """Load a sample article for testing."""
    return {
        "title": "Economic Impact of Climate Change Policies",
        "body": """
        The implementation of carbon taxes and emission trading schemes continues to be 
        debated among economists and policymakers. Proponents argue these measures will drive 
        innovation in clean energy technologies and create new jobs, while critics contend they 
        will harm economic growth and disproportionately impact certain industries.
        
        Recent studies from major economic institutions suggest that well-designed climate policies 
        could have minimal negative effects on GDP growth if revenues are properly reinvested. 
        However, concerns remain about the competitive disadvantage faced by countries adopting 
        stringent policies compared to those with fewer restrictions.
        
        Industry representatives have called for a gradual approach to implementation, allowing 
        businesses time to adapt. Meanwhile, environmental advocates push for more immediate action, 
        citing the escalating costs of climate-related disasters.
        """
    }

def load_article_from_file(file_path):
    """Load article from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        if 'title' in data and 'body' in data:
            return data
        elif 'article' in data:
            return data['article']
        else:
            print("Warning: Invalid JSON structure. Expected an object with 'title' and 'body' fields.")
            return None
    except Exception as e:
        print(f"Error loading article from file: {str(e)}")
        return None

def main():
    """Main function to test the underrepresented voices API."""
    args = parse_arguments()
    
    # Determine the source of the article
    if args.file:
        article = load_article_from_file(args.file)
        if not article:
            print("Error: Could not load article from file.")
            sys.exit(1)
    elif args.title and args.body:
        article = {
            "title": args.title,
            "body": args.body
        }
    else:
        article = load_sample_article()
    
    print(f"\nAnalyzing article: \"{article['title']}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Initialize the API class
        voices = UnderrepresentedVoices()
        
        # Call the API function
        results = voices.identify_underrepresented_perspectives(article)
        
        # Display the results
        display_results(article, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 