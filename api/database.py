import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Database:
    """Database connection manager for Supabase."""
    
    _instance = None
    _backend_client = None  # Store FastAPI backend's client when set
    
    def __new__(cls):
        """Singleton pattern to ensure only one database connection is created."""
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    @classmethod
    def set_backend_client(cls, client: Client):
        """Set Supabase client from the FastAPI backend.
        
        This allows the API modules to use the same client instance as the backend.
        """
        cls._backend_client = client
        if cls._instance:
            cls._instance.client = client
            cls._instance.is_connected = True
            cls._instance.tables_exist = cls._instance._check_tables_exist()
            logger.info("Using FastAPI backend's Supabase client")
    
    def _initialize(self):
        """Initialize the Supabase client."""
        # First check if a backend client has been set
        if Database._backend_client:
            self.client = Database._backend_client
            logger.info("Using shared FastAPI backend Supabase client")
        else:
            # Otherwise, create our own client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
            
            self.client = create_client(supabase_url, supabase_key)
            logger.info("Created new Supabase client")
            
        self.is_connected = True
        self.table_prefix = ""  # No prefix, use the exact table name
        self.tables_exist = self._check_tables_exist()
        
        if not self.tables_exist:
            logger.warning("Required tables do not exist in Supabase. Run the init_db.py script to create them.")
    
    def _check_tables_exist(self) -> bool:
        """Check if the required tables exist in the database."""
        try:
            response = self.client.table("news").select('id').limit(1).execute()
            # If no error is raised, table exists
            return True
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                return False
            else:
                # Some other error occurred
                logger.error(f"Error checking tables: {str(e)}")
                return False
    
    def get_client(self) -> Client:
        """Get the Supabase client instance."""
        return self.client
    
    def fetch_articles(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch articles from the database."""
        if not self.tables_exist:
            logger.warning("Skipping fetch_articles: Tables don't exist yet")
            return []
            
        try:
            response = self.client.table("news").select('*').limit(limit).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching articles: {str(e)}")
            return []
    
    def fetch_article_by_id(self, article_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific article by ID."""
        if not self.tables_exist:
            logger.warning("Skipping fetch_article_by_id: Tables don't exist yet")
            return None
            
        try:
            response = self.client.table("news").select('*').eq('id', article_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching article by ID: {str(e)}")
            return None
    
    def fetch_previous_analyses(self, module: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch previous analysis results for a specific module.
        
        Args:
            module (str): The module name to filter by
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of previous analysis results
        """
        if not self.tables_exist:
            logger.warning("Skipping fetch_previous_analyses: Tables don't exist yet")
            return []
            
        try:
            response = self.client.table("analysis_results") \
                .select('*') \
                .eq('module', module) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching previous analyses: {str(e)}")
            return []
    
    def save_analysis_result(self, query: str, result: Dict[str, Any], module: str) -> bool:
        """Save analysis results to the database."""
        if not self.tables_exist:
            logger.warning("Skipping save_analysis_result: Tables don't exist yet")
            return False
            
        try:
            data = {
                'query': query,
                'result': json.dumps(result),
                'module': module,
                'created_at': 'now()'
            }
            response = self.client.table("analysis_results").insert(data).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error saving analysis result: {str(e)}")
            return False
    
    def fetch_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Fetch user customization settings."""
        if not self.tables_exist:
            logger.warning("Skipping fetch_user_settings: Tables don't exist yet")
            return {"emphasis_level": 5, "focus_groups": [], "tone": "balanced"}
            
        try:
            response = self.client.table("user_settings").select('*').eq('user_id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return {"emphasis_level": 5, "focus_groups": [], "tone": "balanced"}
        except Exception as e:
            logger.error(f"Error fetching user settings: {str(e)}")
            return {"emphasis_level": 5, "focus_groups": [], "tone": "balanced"}
    
    def save_synthesized_article(self, title: str, content: str, source_ids: List[str]) -> Optional[str]:
        """Save a synthesized article to the database."""
        if not self.tables_exist:
            logger.warning("Skipping save_synthesized_article: Tables don't exist yet")
            return None
            
        try:
            data = {
                'title': title,
                'content': content,
                'source_ids': json.dumps(source_ids),
                'created_at': 'now()'
            }
            response = self.client.table("synthesized_articles").insert(data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error saving synthesized article: {str(e)}")
            return None 