import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path to access .env file
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv()

def insert_test_article():
    """Insert a test article into the Supabase database"""
    print("Inserting test article into Supabase...")
    
    # Print current directory for debugging
    print(f"Current directory: {os.getcwd()}")
    print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    print(f"Supabase URL found: {'Yes' if supabase_url else 'No'}")
    print(f"Supabase Key found: {'Yes' if supabase_key else 'No'}")
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in .env file")
        print(f"Environment variables: {os.environ.keys()}")
        return False
    
    try:
        # Initialize Supabase client
        print("Initializing Supabase client...")
        supabase = create_client(supabase_url, supabase_key)
        
        # Create a test article
        test_article = {
            "source_name": "Test News Source",
            "source_link": "https://testnews.example.com",
            "news_information": """
            This is a test article that was automatically inserted to verify the Supabase connection.
            
            The article discusses the latest developments in AI technology and its impact on society.
            Researchers have found that AI models can be used to generate balanced news articles
            that incorporate diverse perspectives and minimize bias.
            
            This test article is being used to verify that the GenesisAI backend can successfully
            connect to the Supabase database and retrieve news information.
            """
        }
        
        print("Inserting article into database...")
        # Insert the test article
        response = supabase.table("news").insert(test_article).execute()
        
        # Check if insertion was successful
        print(f"Response received: {response}")
        
        if hasattr(response, 'data') and len(response.data) > 0:
            print("Successfully inserted test article into Supabase")
            print(f"Article ID: {response.data[0].get('id')}")
            return True
        else:
            print("Failed to insert test article: Unexpected response format")
            print(f"Response: {response}")
            return False
            
    except Exception as e:
        print(f"Error inserting test article: {str(e)}")
        print(f"Error type: {type(e)}")
        return False

if __name__ == "__main__":
    print("Starting test article insertion...")
    result = insert_test_article()
    print(f"Insertion {'successful' if result else 'failed'}")
    print("Done.") 