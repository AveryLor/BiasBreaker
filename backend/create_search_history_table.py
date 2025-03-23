import os
from dotenv import load_dotenv
from supabase import create_client
import requests

# Load environment variables
load_dotenv()

def create_search_history_table():
    """Create the search_history table in Supabase."""
    
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
        
        # First, check if the table already exists
        print("\nChecking if search_history table exists...")
        try:
            result = supabase.table("search_history").select("id").limit(1).execute()
            print("Table 'search_history' already exists. No need to create it.")
            return True
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                print("Table 'search_history' does not exist. Attempting to create it...")
            else:
                print(f"Unexpected error checking table: {e}")
                return False
        
        # SQL to create the search_history table
        sql = """
        CREATE TABLE IF NOT EXISTS search_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            query TEXT NOT NULL, 
            timestamp TIMESTAMPTZ NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
        """
        
        # Using Supabase service role key allows executing raw SQL
        # But this is NOT available through the client API directly
        # So we need to provide instructions for manual creation instead
        print("\nTo create the search_history table, follow these steps:")
        print("1. Log in to your Supabase dashboard")
        print("2. Go to the SQL Editor")
        print("3. Create a new query")
        print("4. Paste the following SQL:")
        print(sql)
        print("5. Run the query")
        print("\nAfter creating the table, run this script again to verify it exists.")
        
        # For safety, we'll ask the user if they've created the table manually
        user_input = input("\nHave you created the table manually? (yes/no): ")
        if user_input.lower() == "yes":
            # Check again if the table exists
            try:
                result = supabase.table("search_history").select("id").limit(1).execute()
                print("Table 'search_history' now exists! You can proceed with using the search history features.")
                return True
            except Exception as e:
                print(f"Error verifying table creation: {e}")
                return False
        else:
            print("\nPlease create the table manually and run this script again.")
            return False
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("==== Create Search History Table ====")
    success = create_search_history_table()
    
    if success:
        print("\nSearch history table exists or was created successfully.")
    else:
        print("\nFailed to verify or create the search_history table.") 