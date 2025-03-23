#!/usr/bin/env python
import os
import sys
import json
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from generative_news_synthesis import GenerativeNewsSynthesis

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test Generative News Synthesis API')
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--articles', nargs='+', 
                      help='List of articles in "Title:Content" format')
    group.add_argument('--file', type=str, 
                      help='JSON file with articles to synthesize')
    
    return parser.parse_args()

def format_article(article):
    """Format an article for display."""
    return f"""
TITLE: {article['title']}
{'='*80}
{article['content'] if 'content' in article else article['body']}
{'='*80}
"""

def display_results(original_articles, synthesized_article):
    """Display the original articles and the synthesized article."""
    print("\n" + "="*80)
    print("GENERATIVE NEWS SYNTHESIS RESULTS")
    print("="*80)
    
    print("\nINPUT ARTICLES:")
    for i, article in enumerate(original_articles, 1):
        print(f"\nARTICLE {i}:")
        print(format_article(article))
    
    print("\nSYNTHESIZED ARTICLE:")
    title = synthesized_article.get('title', '')
    body = synthesized_article.get('body', '')
    summary = synthesized_article.get('summary', '')
    
    print(f"\nTITLE: {title}")
    print("="*80)
    print(body)
    print("="*80)
    print(f"\nSUMMARY: {summary}")

def load_sample_articles():
    """Load sample articles for testing."""
    return [
        {
            "title": "New AI Breakthrough in Healthcare",
            "content": "Researchers at Stanford have developed a new AI system that can detect early signs of cancer with 95% accuracy, outperforming human radiologists. The system was trained on millions of medical images and could save countless lives through early detection."
        },
        {
            "title": "Ethics Concerns Raised Over Medical AI",
            "content": "Privacy advocates are raising concerns about the collection and use of patient data in training medical AI systems. Questions about consent, data ownership, and potential biases in these systems remain largely unaddressed by regulatory bodies."
        },
        {
            "title": "AI Healthcare Tools Show Promise in Rural Areas",
            "content": "Pilot programs bringing AI diagnostic tools to underserved rural communities show promising results. These tools may help address healthcare disparities by providing expert-level diagnostics in areas with limited access to specialists."
        }
    ]

def parse_article_strings(article_strings):
    """Parse article strings in "Title:Content" format."""
    articles = []
    for article_str in article_strings:
        try:
            title, content = article_str.split(':', 1)
            articles.append({
                "title": title.strip(),
                "content": content.strip()
            })
        except ValueError:
            print(f"Warning: Skipping improperly formatted article: {article_str}")
    return articles

def load_articles_from_file(file_path):
    """Load articles from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            return data
        elif 'articles' in data:
            return data['articles']
        else:
            print("Warning: Invalid JSON structure. Expected a list of articles or an object with an 'articles' key.")
            return []
    except Exception as e:
        print(f"Error loading articles from file: {str(e)}")
        return []

def main():
    """Main function to test the generative news synthesis API."""
    args = parse_arguments()
    
    # Determine the source of articles
    if args.articles:
        articles = parse_article_strings(args.articles)
    elif args.file:
        articles = load_articles_from_file(args.file)
    else:
        articles = load_sample_articles()
    
    if not articles:
        print("Error: No articles to synthesize.")
        sys.exit(1)
    
    print(f"\nSynthesizing {len(articles)} articles...")
    print("Processing... (this may take a moment)")
    
    try:
        # Initialize the API class
        synthesizer = GenerativeNewsSynthesis()
        
        # Call the API function
        synthesized_article = synthesizer.synthesize_articles(articles)
        
        # Display the results
        display_results(articles, synthesized_article)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 