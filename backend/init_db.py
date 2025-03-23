import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def initialize_database():
    """
    Initialize the Supabase database with the required tables.
    This script should be run once to set up the database schema.
    """
    try:
        # Connect to Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
            sys.exit(1)
            
        logger.info(f"Connecting to Supabase at: {supabase_url}")
        supabase = create_client(supabase_url, supabase_key)
        
        # Create users table
        logger.info("Creating 'users' table...")
        supabase.table("users").create({
            "id": {
                "type": "int8",
                "primaryKey": True,
                "identity": {
                    "generated_by_default": True
                }
            },
            "email": {
                "type": "text",
                "unique": True,
                "notNull": True
            },
            "hashed_password": {
                "type": "text",
                "notNull": True
            },
            "name": {
                "type": "text",
                "notNull": True
            },
            "created_at": {
                "type": "timestamptz",
                "notNull": True,
                "default": {
                    "type": "now"
                }
            }
        })
        
        # Create user_queries table
        logger.info("Creating 'user_queries' table...")
        supabase.table("user_queries").create({
            "id": {
                "type": "int8",
                "primaryKey": True,
                "identity": {
                    "generated_by_default": True
                }
            },
            "user_id": {
                "type": "int8",
                "notNull": True,
                "references": {
                    "table": "users",
                    "column": "id",
                    "onDelete": "cascade"
                }
            },
            "query": {
                "type": "text",
                "notNull": True
            },
            "timestamp": {
                "type": "timestamptz",
                "notNull": True,
                "default": {
                    "type": "now"
                }
            }
        })
        
        logger.info("Database initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting database initialization...")
    success = initialize_database()
    
    if success:
        logger.info("Database setup completed successfully.")
    else:
        logger.error("Database setup failed.")
        sys.exit(1) 