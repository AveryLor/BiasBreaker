#!/usr/bin/env python
import os
import sys
import json
import traceback
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from database import Database
    from natural_language_understanding import NaturalLanguageUnderstanding
except Exception as e:
    print(f"Error importing modules: {str(e)}")
    traceback.print_exc()
    sys.exit(1)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Database Connection Test Tool')
    parser.add_argument('--detailed', action='store_true', help='Show detailed database information')
    parser.add_argument('--nlu-query', type=str, help='Query to test NLU processing')
    return parser.parse_args()

def test_database_connection(detailed=False):
    """Test connection to the Supabase database."""
    print("\n" + "="*60)
    print("TESTING DATABASE CONNECTION")
    print("="*60)
    
    try:
        db = Database()
        print(f"Database initialized successfully")
        print(f"Database connection status: {db.is_connected}")
        print(f"Tables exist: {db.tables_exist}")
        print(f"Table prefix: {db.table_prefix}")
        
        if db.tables_exist:
            # Try to fetch articles
            print("\nFetching articles:")
            articles = db.fetch_articles(limit=2)
            
            if articles:
                print(f"Found {len(articles)} articles")
                for i, article in enumerate(articles, 1):
                    print(f"\n  Article {i}:")
                    print(f"    ID: {article.get('id', 'unknown')}")
                    print(f"    Title: {article.get('title', 'Untitled')}")
                    content = article.get('content', article.get('body', ''))
                    if content:
                        print(f"    Content: {content[:100]}...")
            else:
                print("No articles found")
            
            # Try to fetch analysis results
            print("\nFetching analysis results:")
            analyses = db.fetch_previous_analyses("natural_language_understanding", 2)
            
            if analyses:
                print(f"Found {len(analyses)} analysis results")
                for i, analysis in enumerate(analyses, 1):
                    print(f"\n  Analysis {i}:")
                    print(f"    Query: {analysis.get('query', 'unknown')}")
                    print(f"    Module: {analysis.get('module', 'unknown')}")
                    print(f"    Created at: {analysis.get('created_at', 'unknown')}")
            else:
                print("No analysis results found")
                
            if detailed:
                # Show detailed table information
                print("\nDetailed Table Information:")
                try:
                    # Check contents of all tables
                    tables = ["articles", "analysis_results", "user_settings", "synthesized_articles"]
                    for table in tables:
                        full_table_name = f"{db.table_prefix}{table}"
                        print(f"\n  Table: {full_table_name}")
                        try:
                            # Try to get row count 
                            # Note: This is a workaround since we can't directly execute SQL COUNT(*)
                            response = db.client.table(full_table_name).select("id").limit(100).execute()
                            count = len(response.data) if hasattr(response, 'data') else 0
                            print(f"    Row count: {count}")
                            
                            # Show data types if possible
                            if count > 0 and hasattr(response, 'data') and len(response.data) > 0:
                                print("    Data structure:")
                                sample_row = response.data[0]
                                for key, value in sample_row.items():
                                    print(f"      {key}: {type(value).__name__}")
                        except Exception as table_err:
                            print(f"    Error examining table: {str(table_err)}")
                except Exception as e:
                    print(f"Error checking detailed table information: {str(e)}")
        else:
            print("\nTables do not exist, cannot fetch data")
            print("You may need to run the init_db.py script to create the database tables.")
        
        return True
        
    except Exception as e:
        print(f"Error testing database connection: {str(e)}")
        traceback.print_exc()
        return False

def test_nlu(query=None):
    """Test the Natural Language Understanding module."""
    print("\n" + "="*60)
    print("TESTING NATURAL LANGUAGE UNDERSTANDING")
    print("="*60)
    
    try:
        nlu = NaturalLanguageUnderstanding()
        
        if not query:
            # Get suggestions from previous queries
            db = Database()
            queries = []
            try:
                analyses = db.fetch_previous_analyses("natural_language_understanding", 5)
                for analysis in analyses:
                    if 'query' in analysis and analysis['query']:
                        queries.append(analysis['query'])
            except:
                pass
            
            if queries:
                print("Previously analyzed queries:")
                for i, q in enumerate(queries, 1):
                    print(f"  {i}. {q}")
                print()
            
            query = input("Enter a query to analyze (or press Enter to skip NLU test): ")
            if not query.strip():
                print("No query provided. Skipping NLU test.")
                return True
        
        print(f"Processing query: {query}")
        
        results = nlu.process_query(query)
        
        print("\nResults:")
        print(f"  Topic: {results.get('topic', 'unknown')}")
        print(f"  Context: {results.get('context', 'unknown')}")
        print("\n  Keywords:")
        for i, keyword in enumerate(results.get('keywords', []), 1):
            print(f"    {i}. {keyword}")
        
        return True
        
    except Exception as e:
        print(f"Error testing NLU: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """Main function to test database connection and NLU module."""
    args = parse_arguments()
    
    print("Starting database and NLU tests...\n")
    
    db_success = test_database_connection(args.detailed)
    
    if db_success:
        print("\nDatabase connection test: SUCCESS")
    else:
        print("\nDatabase connection test: FAILED")
        print("Please check the database configuration in .env file.")
        print("You might need to run the init_db.py script to create the necessary tables.")
    
    if args.nlu_query:
        nlu_success = test_nlu(args.nlu_query)
    else:
        print("\nWould you like to test the NLU module? (y/n): ")
        choice = input().lower()
        if choice.startswith('y'):
            nlu_success = test_nlu()
        else:
            print("\nSkipping NLU test.")
            nlu_success = True
    
    if nlu_success:
        print("\nNLU test: SUCCESS")
    else:
        print("\nNLU test: FAILED")
    
    print("\nTests completed.")

if __name__ == "__main__":
    main() 