#!/usr/bin/env python
import os
import sys
import json
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from dei_focus import DEIFocus

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test DEI Focus API')
    parser.add_argument('--file', type=str, 
                        help='JSON file containing article with identified voices')
    return parser.parse_args()

def display_results(article_data, results):
    """Display the original and enhanced articles."""
    print("\n" + "="*80)
    print("DEI FOCUS ENHANCEMENT RESULTS")
    print("="*80)
    
    # Display original article
    if 'main_article' in article_data:
        print("\nORIGINAL ARTICLE:")
        print("-" * 80)
        print(f"TITLE: {article_data['main_article']['title']}")
        print("-" * 40)
        print(article_data['main_article']['body'][:500] + "..." if len(article_data['main_article']['body']) > 500 else article_data['main_article']['body'])
    
    # Display underrepresented voices identified
    if 'underrepresented' in article_data:
        print("\nIDENTIFIED UNDERREPRESENTED VOICES:")
        for voice in article_data['underrepresented']['demographics']:
            print(f"- {voice}")
    
    # Display enhanced article
    if 'updated_article' in results:
        print("\n\nENHANCED ARTICLE:")
        print("-" * 80)
        print(f"TITLE: {results['updated_article']['title']}")
        print("-" * 40)
        print(results['updated_article']['content'][:500] + "..." if len(results['updated_article']['content']) > 500 else results['updated_article']['content'])
    
    # Display DEI section
    if 'dei_section' in results:
        print("\nDEI SECTION:")
        print("-" * 80)
        print(results['dei_section'])
    
    print("\n" + "="*80)
    print("Note: Use --file option to test with your own article data")
    print("="*80)

def load_sample_article_data():
    """Load sample article data with identified voices for testing."""
    return {
        "main_article": {
            "title": "Global Economic Trends Show Mixed Results",
            "body": """
            The global economy continued to show mixed results across different regions last quarter.
            Western economies maintained steady growth, with the United States reporting a 2.3% increase in GDP.
            Meanwhile, developing nations faced significant challenges including inflation and limited access to capital markets.
            In Southeast Asia, women-led businesses reported particular difficulty securing funding despite showing stronger performance metrics.
            Indigenous communities in Latin America have cited lack of infrastructure as hampering economic development.
            Experts from major financial institutions project continued growth for established markets while expressing concern about wealth inequality.
            """
        },
        "underrepresented": {
            "segments": [
                "In Southeast Asia, women-led businesses reported particular difficulty securing funding despite showing stronger performance metrics.",
                "Indigenous communities in Latin America have cited lack of infrastructure as hampering economic development.",
                "Experts from major financial institutions project continued growth for established markets while expressing concern about wealth inequality."
            ],
            "demographics": [
                "Women business owners",
                "Indigenous communities",
                "Developing nations"
            ]
        }
    }

def load_data_from_file(file_path):
    """Load article data from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Basic validation
        if 'main_article' not in data or 'underrepresented' not in data:
            print("Warning: Expected 'main_article' and 'underrepresented' fields in input file.")
            return None
        
        return data
    except Exception as e:
        print(f"Error loading article data from file: {str(e)}")
        return None

def main():
    """Main function to test the DEI focus API."""
    args = parse_arguments()
    
    # Determine the source of the article data
    if args.file:
        article_data = load_data_from_file(args.file)
        if not article_data:
            print("Error: Could not load article data from file.")
            sys.exit(1)
    else:
        article_data = load_sample_article_data()
    
    print(f"\nEnhancing DEI focus for article: \"{article_data['main_article']['title']}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Initialize the API class
        dei = DEIFocus()
        
        # Call the API function
        results = dei.emphasize_dei(article_data)
        
        # Display the results
        display_results(article_data, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 