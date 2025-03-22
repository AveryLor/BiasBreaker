#!/usr/bin/env python
import os
import sys
import json
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from neutrality_check import NeutralityCheck

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test Neutrality Check API')
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--file', type=str, 
                      help='JSON file containing article data')
    group.add_argument('--title', type=str, 
                      help='Article title')
    group.add_argument('--article-id', type=str,
                      help='ID of article to fetch from database')
    
    parser.add_argument('--content', type=str, 
                      help='Article content (required if --title is provided)')
    
    return parser.parse_args()

def display_results(article_data, results):
    """Display the analysis results in a readable format."""
    print("\n" + "="*80)
    print("NEUTRALITY CHECK RESULTS")
    print("="*80)
    
    # Get the article content based on the structure
    if 'customized_article' in article_data:
        article = article_data['customized_article']
    else:
        article = article_data
    
    print(f"\nARTICLE TITLE: {article['title']}")
    print("-" * 80)
    content = article.get('content', article.get('body', ''))
    print(content[:300] + "..." if len(content) > 300 else content)
    print("-" * 80)
    
    if 'bias_score' in results:
        print(f"\nBIAS SCORE: {results['bias_score']}/100 (0=far left, 50=neutral, 100=far right)")
        
        if results['bias_score'] < 40:
            print("The article leans left")
        elif results['bias_score'] > 60:
            print("The article leans right")
        else:
            print("The article is relatively balanced/neutral")
    
    if 'biased_segments' in results:
        print("\nBIASED SEGMENTS DETECTED:")
        for i, segment in enumerate(results['biased_segments'], 1):
            print(f"  {i}. {segment}")
    
    if 'recommendations' in results:
        print("\nRECOMMENDATIONS:")
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"  {i}. {rec}")
    
    print("\n" + "="*80)

def load_sample_article_data():
    """Load a sample article data for testing."""
    return {
        "customized_article": {
            "title": "Economic Policies Divide Political Spectrum",
            "content": """
            The debate over economic policies continues to divide political factions.
            Conservative economists argue that tax cuts for businesses stimulate growth and create jobs.
            Progressive voices counter that increased social spending and higher taxes on wealthy individuals
            would reduce inequality and provide more sustainable economic benefits.
            Recent data suggests that both approaches have merits depending on economic conditions.
            Small business owners have expressed concerns about regulatory burdens, while labor advocates
            point to stagnant wages despite productivity gains.
            """
        }
    }

def load_article_from_file(file_path):
    """Load article from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"Error loading article from file: {str(e)}")
        return None

def main():
    """Main function to test the neutrality check API."""
    args = parse_arguments()
    neutrality = NeutralityCheck()
    
    # Initialize article_data
    article_data = None
    
    # Determine the source of the article
    if args.article_id:
        print(f"Fetching article with ID: {args.article_id} from database...")
        article_data = neutrality.fetch_article_for_check(args.article_id)
    elif args.file:
        article_data = load_article_from_file(args.file)
        if not article_data:
            print("Error: Could not load article from file.")
            sys.exit(1)
    elif args.title and args.content:
        article_data = {
            "customized_article": {
                "title": args.title,
                "content": args.content
            }
        }
    else:
        if args.title and not args.content:
            print("Error: --content is required when --title is provided.")
            sys.exit(1)
        
        # Try to fetch most recent article from database
        print("No specific article provided. Attempting to fetch most recent article from database...")
        article_data = neutrality.fetch_article_for_check()
        
        # If no article found in database or it's the default, use sample data
        if article_data["customized_article"]["title"] == "No article available":
            print("No articles found in database. Using sample article data.")
            article_data = load_sample_article_data()
    
    # Determine article title for display
    if 'customized_article' in article_data:
        article_title = article_data['customized_article']['title']
    else:
        article_title = "the provided article"
    
    print(f"\nEvaluating neutrality of article: \"{article_title}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Call the API function
        results = neutrality.evaluate_neutrality(article_data)
        
        # Display the results
        display_results(article_data, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 