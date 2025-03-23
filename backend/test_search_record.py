import os
import datetime
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_direct_insert():
    """Directly insert a record into the search_history table to test database connection."""
    
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
        
        # First, verify the search_history table exists
        print("Checking if search_history table exists...")
        try:
            result = supabase.table("search_history").select("id").limit(1).execute()
            print(f"Search_history table exists. Sample data: {result.data}")
        except Exception as e:
            print(f"Error: {e}")
            print("Please make sure the search_history table exists.")
            return False
        
        # Create test search data
        user_id = 1  # Use a known user ID that exists in your database
        search_data = {
            "user_id": user_id,
            "query": "Test direct insert",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        print(f"Attempting to insert test record: {search_data}")
        
        # Insert the data
        try:
            result = supabase.table("search_history").insert(search_data).execute()
            if result.data:
                print(f"Success! Record inserted with ID: {result.data[0].get('id')}")
                
                # Verify by retrieving the record
                print("Verifying insertion by retrieving records...")
                fetch_result = supabase.table("search_history").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(5).execute()
                
                if fetch_result.data:
                    print(f"Retrieved {len(fetch_result.data)} records:")
                    for idx, item in enumerate(fetch_result.data):
                        print(f"{idx+1}. ID: {item.get('id')} | Query: {item.get('query')} | Timestamp: {item.get('timestamp')}")
                else:
                    print("No records found after insertion!")
                
                return True
            else:
                print("No data returned from insertion!")
                return False
        except Exception as e:
            print(f"Error inserting data: {e}")
            import traceback
            traceback.print_exc()
            return False
        
    except Exception as e:
        print(f"Error in test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("==== Testing Direct Insertion to search_history ====")
    success = test_direct_insert()
    
    if success:
        print("\nDirect insertion test completed successfully!")
    else:
        print("\nDirect insertion test failed.") 