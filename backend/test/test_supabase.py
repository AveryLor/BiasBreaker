import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path to access .env file
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test connection to Supabase database"""
    print("Testing Supabase connection...")
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in .env file")
        return False
    
    try:
        # Initialize Supabase client
        supabase = create_client(supabase_url, supabase_key)
        
        # Test a simple query - fetch all news articles
        response = supabase.table("news").select("*").limit(1).execute()
        
        # Check if we got a valid response
        if hasattr(response, 'data'):
            if len(response.data) > 0:
                print("Success! Connected to Supabase and retrieved data.")
                print(f"Sample data: {response.data[0]}")
                return True
            else:
                print("Connected to Supabase but no data found in the 'news' table.")
                return True
        else:
            print("Connected to Supabase but received unexpected response format.")
            return False
            
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        return False

if __name__ == "__main__":
    test_supabase_connection() 