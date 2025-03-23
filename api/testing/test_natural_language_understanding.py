#!/usr/bin/env python
import os
import sys
import json
import argparse
from pprint import pprint
import traceback
import random
import time

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the module to test
from api.natural_language_understanding import NaturalLanguageUnderstanding
from api.database import Database

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Genesis AI News Chatbot')
    parser.add_argument('--interactive', action='store_true', help='Start interactive chat mode')
    parser.add_argument('--query', type=str, help='Query to analyze (non-interactive mode)')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--generate-topics', action='store_true', help='Generate a list of possible topics')
    return parser.parse_args()

def display_chat_response(response):
    """Display the chatbot response in a readable format."""
    print("\n" + "-"*60)
    
    # Display the main chatbot response
    print("\nGenesis: ", end="")
    # Print the response word by word for a more natural feeling
    words = response["response"].split()
    for word in words:
        print(word, end=" ", flush=True)
        time.sleep(0.05)  # Slight delay between words
    print()
    
    # Display relevant articles if any
    if response["articles"]:
        print("\nRelevant articles found:")
        for i, article in enumerate(response["articles"], 1):
            print(f"  {i}. {article['title']}")
            print(f"     {article['summary']}")
            print(f"     Relevance: {article['relevance']}")
            print()
    
    print("-"*60)

def get_database_topics(debug=False):
    """Fetch topics from articles in the database."""
    db = Database()
    topics = []
    
    # Extract topics from articles
    try:
        articles = db.fetch_articles(limit=10)
        for article in articles:
            title = article.get('title', '')
            if title:
                # Extract the main subject from the title
                topics.append(title.split(':')[0])
    except Exception as e:
        if debug:
            print(f"Error extracting topics from articles: {str(e)}")
    
    # Remove duplicates and limit to 5 topics
    topics = list(set(topics))[:5]
    
    return topics

def interactive_chat(debug=False):
    """Run an interactive chat session with the Genesis AI Chatbot."""
    print("\n" + "="*60)
    print("                  GENESIS AI NEWS CHATBOT")
    print("="*60)
    print("\nHi there! I'm Genesis, your AI news assistant. I can help you")
    print("find information about news topics in my database.")
    print("Type 'exit', 'quit', or 'bye' to end our conversation.")
    
    # Initialize the chatbot and database
    try:
        nlu = NaturalLanguageUnderstanding()
        db = Database()
        
        # Check if database is connected
        if debug:
            print(f"Database connection status: {db.is_connected}")
            print(f"Tables exist: {db.tables_exist}")
            
        # Get topics from the database
        topics = get_database_topics(debug)
        if topics:
            print("\nI have information about these topics:")
            for topic in topics:
                print(f"  • {topic}")
            print("\nWhat would you like to know about?")
        else:
            print("\nWhat would you like to know about? (Note: I can only answer")
            print("questions about topics I have in my database)")
            
    except Exception as e:
        print(f"Error initializing modules: {str(e)}")
        if debug:
            traceback.print_exc()
        return
    
    while True:
        # Get user input
        try:
            print("\nYou: ", end="")
            query = input()
        except EOFError:
            print("\nGoodbye! Hope to chat again soon!")
            break
        
        # Check for exit command
        if query.lower() in ['exit', 'quit', 'bye']:
            print("\nGenesis: Goodbye! Hope to chat again soon!")
            break
        
        if not query.strip():
            continue
            
        print("Genesis: ", end="")
        print("Searching database", end="", flush=True)
        for _ in range(3):  # Loading indicator
            time.sleep(0.3)
            print(".", end="", flush=True)
        print()
        
        try:
            # Process the query
            response = nlu.process_query(query)
            
            # Display the response
            display_chat_response(response)
            
            # If no articles were found, suggest some topics
            if not response["articles"]:
                topics = get_database_topics(debug)
                if topics:
                    print("\nGenesis: I can provide information about these topics instead:")
                    for topic in topics:
                        print(f"  • {topic}")
            
        except Exception as e:
            print(f"\nI'm sorry, I encountered an error: {str(e)}")
            if debug:
                traceback.print_exc()

def generate_topic_list():
    """Generate a list of topics available in the database."""
    print("\n" + "="*60)
    print("TOPICS AVAILABLE IN THE DATABASE")
    print("="*60)
    
    # Get topics from the database
    db = Database()
    topics = get_database_topics(True)
    
    if topics:
        print("\nTopics found in the database:")
        for i, topic in enumerate(topics, 1):
            print(f"{i}. {topic}")
    else:
        print("\nNo topics found in the database. Please ensure the database contains articles.")
    
    # Show some sample queries
    print("\nExample questions you can ask Genesis:")
    print("1. Tell me about [topic]")
    print("2. What's the latest news on [topic]?")
    print("3. I'm interested in learning about [topic]")
    print("4. Do you have any information about [topic]?")

def main():
    """Main function to run the Genesis AI News Chatbot."""
    args = parse_arguments()
    debug = args.debug
    
    if debug:
        print("Debug mode enabled")
    
    if args.generate_topics:
        generate_topic_list()
        return
        
    if args.interactive:
        interactive_chat(debug)
    else:
        # Use provided query or ask the user for one
        if not args.query:
            topics = get_database_topics(debug)
            if topics:
                print("\nTopics available in the database:")
                for i, topic in enumerate(topics, 1):
                    print(f"{i}. {topic}")
                
            query = input("\nEnter your question: ")
        else:
            query = args.query
        
        if not query.strip():
            print("No question provided. Exiting.")
            return
            
        print(f"\nYou asked: \"{query}\"")
        print("\nGenesis is searching the database...")
        
        try:
            # Initialize the chatbot
            nlu = NaturalLanguageUnderstanding()
            
            # Process the query
            response = nlu.process_query(query)
            
            # Display the response
            display_chat_response(response)
            
            # If no articles were found, suggest some topics
            if not response["articles"]:
                topics = get_database_topics(debug)
                if topics:
                    print("\nI can provide information about these topics instead:")
                    for topic in topics:
                        print(f"  • {topic}")
            
        except Exception as e:
            print(f"\nError: {str(e)}")
            if debug:
                traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    main() 