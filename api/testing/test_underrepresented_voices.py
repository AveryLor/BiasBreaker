#!/usr/bin/env python
import os
import sys
import json
import argparse
import difflib
import traceback
from pprint import pprint

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the module to test
from api.underrepresented_voices import UnderrepresentedVoices
from api.database import Database

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test Underrepresented Voices API')
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--title', type=str, help='Article title')
    group.add_argument('--file', type=str, help='JSON file containing article data')
    group.add_argument('--article-id', type=str, help='ID of article to fetch from database')
    group.add_argument('--interactive', action='store_true', 
                      help='Interactive mode: list articles from database and analyze selected one')
    
    parser.add_argument('--body', type=str, help='Article body content')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    return parser.parse_args()

def display_results(article, results):
    """Display the analysis results in a readable format."""
    print("\n" + "="*80)
    print("UNDERREPRESENTED VOICES ANALYSIS RESULTS")
    print("="*80)
    
    print(f"\nARTICLE TITLE: {article['title']}")
    print("-" * 80)
    article_body = article.get('body', article.get('content', ''))
    print(article_body[:300] + "..." if len(article_body) > 300 else article_body)
    print("-" * 80)
    
    if 'underrepresented' in results:
        if 'segments' in results['underrepresented']:
            print("\nUNDERREPRESENTED SEGMENTS:")
            if results['underrepresented']['segments']:
                for i, segment in enumerate(results['underrepresented']['segments'], 1):
                    print(f"  {i}. {segment}")
            else:
                print("  None detected")
        
        if 'demographics' in results['underrepresented']:
            print("\nUNDERREPRESENTED DEMOGRAPHICS:")
            if results['underrepresented']['demographics']:
                for i, demographic in enumerate(results['underrepresented']['demographics'], 1):
                    print(f"  {i}. {demographic}")
            else:
                print("  None detected")
    
    if 'recommendations' in results:
        print("\nRECOMMENDATIONS:")
        if results['recommendations']:
            for i, rec in enumerate(results['recommendations'], 1):
                print(f"  {i}. {rec}")
        else:
            print("  No specific recommendations")
    
    # Display historical analysis comparison if available
    if 'historical_analyses' in results:
        print("\nHISTORICAL ANALYSES FOR SIMILAR ARTICLES:")
        if results['historical_analyses']:
            for i, analysis in enumerate(results['historical_analyses'], 1):
                print(f"  {i}. Article: \"{analysis.get('article_title', 'Unknown')}\"")
                if 'demographics' in analysis:
                    print(f"     Demographics: {', '.join(analysis.get('demographics', [])[:3])}")
                if 'similarity' in analysis:
                    print(f"     Similarity: {analysis.get('similarity', 'N/A')}")
                print(f"     Timestamp: {analysis.get('timestamp', 'N/A')}")
        else:
            print("  None found")
    
    print("\n" + "="*80)

def load_article_from_file(file_path):
    """Load article from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        if 'title' in data and ('body' in data or 'content' in data):
            if 'body' not in data and 'content' in data:
                data['body'] = data['content']
            return data
        elif 'article' in data:
            return data['article']
        else:
            print("Warning: Invalid JSON structure. Expected an object with 'title' and 'body' fields.")
            return None
    except Exception as e:
        print(f"Error loading article from file: {str(e)}")
        return None

def fetch_article_from_db(article_id=None, debug=False):
    """Fetch an article from the database."""
    db = Database()
    
    if debug:
        print(f"Database connection status: {db.is_connected}")
    
    if article_id:
        article = db.fetch_article_by_id(article_id)
        if article:
            if debug:
                print(f"Found article with ID {article_id}")
            return {
                "title": article.get('title', 'Untitled'),
                "body": article.get('content', article.get('body', ''))
            }
    
    # If no article ID provided or article not found, fetch the most recent
    articles = db.fetch_articles(limit=1)
    if articles and len(articles) > 0:
        if debug:
            print("Found most recent article")
        return {
            "title": articles[0].get('title', 'Untitled'),
            "body": articles[0].get('content', articles[0].get('body', ''))
        }
    
    # No articles found
    if debug:
        print("No articles found in database")
    return {
        "title": "No article available",
        "body": "Please provide an article to analyze or add articles to the database."
    }

def interactive_mode(debug=False):
    """Run an interactive session to select and analyze articles from the database."""
    print("\n" + "="*80)
    print("UNDERREPRESENTED VOICES - INTERACTIVE MODE")
    print("="*80)
    print("\nFetching articles from database...")
    
    db = Database()
    voices = UnderrepresentedVoices()
    
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
    article = {
        "title": selected_article.get('title', 'Untitled'),
        "body": selected_article.get('content', selected_article.get('body', ''))
    }
    
    # Analyze the article
    print(f"\nAnalyzing article: \"{article['title']}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Call the API function
        results = voices.identify_underrepresented_perspectives(article)
        
        # Add historical analysis comparison
        add_historical_analysis(results, article['title'], debug)
        
        # Display the results
        display_results(article, results)
    except Exception as e:
        print(f"\nError: {str(e)}")
        if debug:
            traceback.print_exc()

def add_historical_analysis(results, article_title, debug=False):
    """Add historical analysis comparison to results."""
    try:
        db = Database()
        prev_analyses = db.fetch_previous_analyses("underrepresented_voices", 5)
        historical_analyses = []
        
        for analysis in prev_analyses:
            # Skip if this is the same article
            if analysis.get('query', '') == article_title:
                continue
                
            similarity = difflib.SequenceMatcher(None, 
                article_title.lower(), 
                analysis['query'].lower()).ratio()
            
            if similarity > 0.3:  # Include if at least 30% similar
                try:
                    result_data = json.loads(analysis['result'])
                    demographics = []
                    if 'underrepresented' in result_data and 'demographics' in result_data['underrepresented']:
                        demographics = result_data['underrepresented']['demographics']
                    
                    historical_analyses.append({
                        'article_title': analysis['query'],
                        'demographics': demographics,
                        'timestamp': analysis.get('created_at', 'Unknown'),
                        'similarity': f"{similarity:.2f}"
                    })
                except json.JSONDecodeError:
                    if debug:
                        print(f"Could not parse previous analysis result")
        
        results['historical_analyses'] = historical_analyses
    except Exception as e:
        print(f"Error fetching historical analyses: {str(e)}")
        if debug:
            traceback.print_exc()
        results['historical_analyses'] = []

def main():
    """Main function to test the underrepresented voices API."""
    args = parse_arguments()
    debug = args.debug
    
    if debug:
        print("Debug mode enabled")
    
    # Check if interactive mode
    if args.interactive:
        interactive_mode(debug)
        return
    
    # Determine the source of the article
    if args.article_id:
        print(f"Fetching article with ID: {args.article_id} from database...")
        article = fetch_article_from_db(args.article_id, debug)
        if article['title'] == 'No article available':
            print("Article not found in database. Please add articles to the database or provide an article to analyze.")
            sys.exit(1)
    elif args.file:
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
        # Try to fetch most recent article from database first
        article = fetch_article_from_db(debug=debug)
        if article['title'] == 'No article available':
            print("No articles found in database. Please add articles to the database or provide an article to analyze.")
            sys.exit(1)
    
    print(f"\nAnalyzing article: \"{article['title']}\"")
    print("Processing... (this may take a moment)")
    
    try:
        # Initialize the API class
        voices = UnderrepresentedVoices()
        
        # Call the API function
        results = voices.identify_underrepresented_perspectives(article)
        
        # Add historical analysis comparison
        add_historical_analysis(results, article['title'], debug)
        
        # Display the results
        display_results(article, results)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        if debug:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 