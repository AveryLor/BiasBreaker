import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def check_supabase_connection():
    """Check Supabase connection and list available tables."""
    
    # Get Supabase credentials from environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_KEY environment variables not set.")
        print("Please set these variables in your .env file.")
        return False
    
    try:
        # Initialize Supabase client
        print(f"Connecting to Supabase at {supabase_url[:20]}...")
        supabase = create_client(supabase_url, supabase_key)
        print("Connected to Supabase successfully!")
        
        # Test connection by querying the users table
        print("\nTesting access to 'users' table...")
        try:
            users_result = supabase.table("users").select("id").limit(1).execute()
            print(f"- Access to 'users' table: SUCCESS")
            print(f"- Found {len(users_result.data)} user(s)")
        except Exception as e:
            print(f"- Access to 'users' table: FAILED")
            print(f"- Error: {e}")
        
        # Test connection to search_history table
        print("\nTesting access to 'search_history' table...")
        try:
            history_result = supabase.table("search_history").select("id").limit(1).execute()
            print(f"- Access to 'search_history' table: SUCCESS")
            print(f"- Found {len(history_result.data)} record(s)")
        except Exception as e:
            print(f"- Access to 'search_history' table: FAILED")
            print(f"- Error: {e}")
            print("\nIf the table doesn't exist, run this SQL in the Supabase SQL editor:")
            print("""
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
            """)
        
        # Test connection to articleInformationDB table
        print("\nTesting access to 'articleInformationDB' table...")
        try:
            articles_result = supabase.table("articleInformationDB").select("id").limit(1).execute()
            print(f"- Access to 'articleInformationDB' table: SUCCESS")
            print(f"- Found {len(articles_result.data)} article(s)")
        except Exception as e:
            print(f"- Access to 'articleInformationDB' table: FAILED")
            print(f"- Error: {e}")
        
        # In a production environment, we'd query information_schema tables to list available tables,
        # but not all Supabase setups allow this
        
        return True
    
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("==== Checking Supabase Connection and Tables ====")
    success = check_supabase_connection()
    
    if success:
        print("\nConnection test completed. See results above for table access status.")
    else:
        print("\nFailed to connect to Supabase.") 