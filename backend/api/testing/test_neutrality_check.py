#!/usr/bin/env python
import os
import sys
import json
import argparse
import difflib
from pprint import pprint
import traceback

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the module to test
from api.neutrality_check import NeutralityCheck
from api.database import Database

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
    group.add_argument('--interactive', action='store_true',
                      help='Interactive mode: list articles from database and analyze selected one')
    
    parser.add_argument('--content', type=str, 
                      help='Article content (required if --title is provided)')
    parser.add_argument('--debug', action='store_true',
                      help='Enable debug output')
    
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
        if results['biased_segments']:
            for i, segment in enumerate(results['biased_segments'], 1):
                print(f"  {i}. {segment}")
        else:
            print("  None detected")
    
    if 'recommendations' in results:
        print("\nRECOMMENDATIONS:")
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"  {i}. {rec}")
            
    # Check if there are previous analyses for similar articles
    if 'previous_analyses' in results:
        print("\nPREVIOUS SIMILAR ANALYSES:")
        if results['previous_analyses']:
            for i, analysis in enumerate(results['previous_analyses'], 1):
                print(f"  {i}. Article: \"{analysis.get('article_title', 'Unknown')}\"")
                print(f"     Score: {analysis.get('bias_score', 'N/A')}")
                print(f"     Timestamp: {analysis.get('timestamp', 'N/A')}")
        else:
            print("  None found")
    
    print("\n" + "="*80)

def load_article_from_file(file_path):
    """Load article from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"Error loading article from file: {str(e)}")
        return None

def get_article_from_database(article_id=None, debug=False):
    """Get an article from the database."""
    db = Database()
    
    if debug:
        print(f"Database connection status: {db.is_connected}")
    
    article_data = None
    
    if article_id:
        article = db.fetch_article_by_id(article_id)
        if article:
            if debug:
                print(f"Found article with ID {article_id}")
            article_data = {
                "customized_article": {
                    "title": article.get('title', 'Untitled'),
                    "content": article.get('content', article.get('body', ''))
                }
            }
    
    if not article_data:
        articles = db.fetch_articles(limit=1)
        if articles and len(articles) > 0:
            if debug:
                print("Found most recent article")
            article_data = {
                "customized_article": {
                    "title": articles[0].get('title', 'Untitled'),
                    "content": articles[0].get('content', articles[0].get('body', ''))
                }
            }
    
    if not article_data:
        # No articles found - create an empty placeholder
        if debug:
            print("No articles found in database")
        article_data = {
            "customized_article": {
                "title": "No article available",
                "content": "Please provide an article to analyze or add articles to the database."
            }
        }
    
    return article_data

def interactive_mode(debug=False):
    """Run an interactive session to select and analyze articles from the database."""
    print("\n" + "="*80)
    print("NEUTRALITY CHECK - INTERACTIVE MODE")
    print("="*80)
    print("\nFetching articles from database...")
    
    db = Database()
    neutrality = NeutralityCheck()
    
    if debug:
        print(f"Database connection status: {db.is_connected}")
    
    articles = db.fetch_articles(limit=10)
    
    if not articles:
        print("No articles found in the database.")
        print("Please add articles to the database or provide an article to analyze.")
        return
    
    # Display available articles
    print("\nAvailable articles:")
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article.get('title', 'Untitled')} (ID: {article.get('id', 'unknown')})")
    
    # Let user select an article
    while True:
        try:
            selection = input("\nEnter the number of the article to analyze (or 'q' to quit): ")
            if selection.lower() == 'q':
                return
            
            idx = int(selection) - 1
            if 0 <= idx < len(articles):
                selected_article = articles[idx]
                break
            else:
                print(f"Invalid selection. Please enter a number between 1 and {len(articles)}.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Format the selected article
    article_data = {
        "customized_article": {
            "title": selected_article.get('title', 'Untitled'),
            "content": selected_article.get('content', selected_article.get('body', ''))
        }
    }
    
    # Analyze the article
    print(f"\nAnalyzing article: \"{article_data['customized_article']['title']}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Call the API function with the article ID to ensure database lookup
        results = neutrality.evaluate_neutrality(article_data)
        
        # Add previous analyses
        try:
            prev_analyses = db.fetch_previous_analyses("neutrality_check", 5)
            similar_analyses = []
            
            for analysis in prev_analyses:
                # Skip if this is the same article
                if analysis['query'] == selected_article.get('title', ''):
                    continue
                    
                similarity = difflib.SequenceMatcher(None, 
                    selected_article.get('title', '').lower(), 
                    analysis['query'].lower()).ratio()
                
                if similarity > 0.3:  # Include if at least 30% similar
                    result_data = json.loads(analysis['result'])
                    similar_analyses.append({
                        'article_title': analysis['query'],
                        'bias_score': result_data.get('bias_score', 'N/A'),
                        'timestamp': analysis.get('created_at', 'Unknown'),
                        'similarity': f"{similarity:.2f}"
                    })
            
            results['previous_analyses'] = similar_analyses
        except Exception as e:
            if debug:
                print(f"Error fetching previous analyses: {str(e)}")
            results['previous_analyses'] = []
        
        # Display the results
        display_results(article_data, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")

def main():
    """Main function to test the neutrality check API."""
    args = parse_arguments()
    debug = args.debug
    
    if debug:
        print("Debug mode enabled")
    
    if args.interactive:
        interactive_mode(debug)
        return
    
    neutrality = NeutralityCheck()
    
    # Initialize article_data
    article_data = None
    
    # Determine the source of the article
    if args.article_id:
        print(f"Fetching article with ID: {args.article_id} from database...")
        article_data = get_article_from_database(args.article_id, debug)
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
        article_data = get_article_from_database(debug=debug)
        
        # If no article found in database, exit
        if article_data["customized_article"]["title"] == "No article available":
            print("No articles found in database. Please add articles to the database or provide an article to analyze.")
            sys.exit(1)
    
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
        
        # Add previous analyses
        try:
            db = Database()
            prev_analyses = db.fetch_previous_analyses("neutrality_check", 5)
            similar_analyses = []
            
            for analysis in prev_analyses:
                # Skip if this is the same article
                if analysis['query'] == article_title:
                    continue
                    
                similarity = difflib.SequenceMatcher(None, 
                    article_title.lower(), 
                    analysis['query'].lower()).ratio()
                
                if similarity > 0.3:  # Include if at least 30% similar
                    result_data = json.loads(analysis['result'])
                    similar_analyses.append({
                        'article_title': analysis['query'],
                        'bias_score': result_data.get('bias_score', 'N/A'),
                        'timestamp': analysis.get('created_at', 'Unknown'),
                        'similarity': f"{similarity:.2f}"
                    })
            
            results['previous_analyses'] = similar_analyses
        except Exception as e:
            if debug:
                print(f"Error fetching previous analyses: {str(e)}")
            results['previous_analyses'] = []
        
        # Display the results
        display_results(article_data, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 