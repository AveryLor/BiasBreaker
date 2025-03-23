import os
from dotenv import load_dotenv
from supabase import create_client
import sys

# Load environment variables
load_dotenv()

def main():
    """Test database structure and connection"""
    print("Testing database structure...")
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("ERROR: Supabase configuration missing. Check your .env file.")
        sys.exit(1)
    
    try:
        print(f"Connecting to Supabase at: {supabase_url}")
        client = create_client(supabase_url, supabase_key)
        
        # Test connection by fetching news table info
        print("Testing news table...")
        try:
            response = client.table("news").select("*").limit(1).execute()
            print(f"Successfully connected to news table. Found {len(response.data)} records.")
            
            # Check if there are records
            if len(response.data) > 0:
                # Check for news_information column
                sample = response.data[0]
                print(f"Sample record fields: {', '.join(sample.keys())}")
                
                if 'news_information' in sample:
                    print("✓ news_information column exists")
                    # Check if it has data
                    if sample['news_information']:
                        print(f"✓ news_information contains data: {sample['news_information'][:50]}...")
                    else:
                        print("✗ news_information column exists but is empty")
                else:
                    print("✗ news_information column does not exist")
            else:
                print("No records found in the news table.")
                
        except Exception as e:
            print(f"ERROR: Failed to query news table: {str(e)}")
            sys.exit(1)
            
    except Exception as e:
        print(f"ERROR: Failed to connect to Supabase: {str(e)}")
        sys.exit(1)
        
    print("Database structure test completed.")

if __name__ == "__main__":
    main() 