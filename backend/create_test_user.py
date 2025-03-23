import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from passlib.context import CryptContext

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_test_user(email="test@example.com", password="password123", name="Test User"):
    """Create a test user in the Supabase database for testing purposes."""
    
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
        
        # Check if user already exists
        print(f"Checking if user {email} already exists...")
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if result.data:
            print(f"User {email} already exists.")
            return True
        
        # Hash the password
        hashed_password = get_password_hash(password)
        
        # Create user data
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "name": name,
        }
        
        print(f"Creating user {email}...")
        result = supabase.table("users").insert(user_data).execute()
        
        if not result.data:
            print("Error: Failed to create user. No data returned from Supabase.")
            return False
        
        user_id = result.data[0]["id"]
        print(f"User created successfully with ID: {user_id}")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
        # Check if search_history table exists
        try:
            # Try to query search_history table
            test_query = supabase.table("search_history").select("id").limit(1).execute()
            print("Search_history table exists.")
        except Exception as e:
            print(f"Error checking search_history table: {e}")
            print("\nIf the search_history table doesn't exist, please create it using the SQL script:")
            print("""
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
            """)
        
        return True
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        return False

if __name__ == "__main__":
    # Get email and password from command line arguments or use defaults
    email = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "password123"
    name = sys.argv[3] if len(sys.argv) > 3 else "Test User"
    
    print("==== Create Test User ====")
    print(f"Creating user with email: {email}")
    
    success = create_test_user(email, password, name)
    
    if success:
        print("\nTest user created or already exists.")
        print("You can now run the test_search_history.py script with these credentials.")
    else:
        print("\nFailed to create test user.") 