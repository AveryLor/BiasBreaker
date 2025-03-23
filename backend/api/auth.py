import os
import bcrypt
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from supabase import Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Auth:
    """Authentication manager for user operations"""
    
    def __init__(self, supabase_client: Client):
        """Initialize with a Supabase client"""
        self.supabase = supabase_client
        
    def register_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Check if user already exists
            existing_user = self.supabase.table("users").select("*").eq("email", user_data.email).execute()
            
            if existing_user.data and len(existing_user.data) > 0:
                return {"success": False, "message": "Email already registered"}
            
            # Hash the password
            hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create user record
            new_user = {
                "email": user_data.email,
                "name": user_data.name,
                "hashed_password": hashed_password,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = self.supabase.table("users").insert(new_user).execute()
            
            if response.data:
                user_data = response.data[0]
                # Remove password from response
                user_data.pop("hashed_password", None)
                return {"success": True, "user": user_data}
            else:
                return {"success": False, "message": "Failed to create user"}
                
        except Exception as e:
            logger.error(f"Error during user registration: {str(e)}")
            return {"success": False, "message": f"Registration error: {str(e)}"}
    
    def login_user(self, credentials: UserLogin) -> Dict[str, Any]:
        """Authenticate a user"""
        try:
            # Get user by email
            response = self.supabase.table("users").select("*").eq("email", credentials.email).execute()
            
            if not response.data or len(response.data) == 0:
                return {"success": False, "message": "Invalid email or password"}
            
            user = response.data[0]
            
            # Check password
            is_valid = bcrypt.checkpw(
                credentials.password.encode('utf-8'),
                user["hashed_password"].encode('utf-8')
            )
            
            if not is_valid:
                return {"success": False, "message": "Invalid email or password"}
            
            # Remove password from response
            user_data = dict(user)
            user_data.pop("hashed_password", None)
            
            return {"success": True, "user": user_data}
            
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return {"success": False, "message": f"Login error: {str(e)}"}
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user information by ID"""
        try:
            response = self.supabase.table("users").select("*").eq("id", user_id).execute()
            
            if not response.data or len(response.data) == 0:
                return None
                
            user = response.data[0]
            # Remove password from response
            user.pop("hashed_password", None)
            
            return user
            
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            return None
    
    def update_password(self, user_id: int, current_password: str, new_password: str) -> Dict[str, Any]:
        """Update user password"""
        try:
            # Get current user
            response = self.supabase.table("users").select("*").eq("id", user_id).execute()
            
            if not response.data or len(response.data) == 0:
                return {"success": False, "message": "User not found"}
                
            user = response.data[0]
            
            # Verify current password
            is_valid = bcrypt.checkpw(
                current_password.encode('utf-8'),
                user["hashed_password"].encode('utf-8')
            )
            
            if not is_valid:
                return {"success": False, "message": "Current password is incorrect"}
            
            # Hash the new password
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update in database
            update_response = self.supabase.table("users").update(
                {"hashed_password": hashed_password}
            ).eq("id", user_id).execute()
            
            if update_response.data:
                return {"success": True, "message": "Password updated successfully"}
            else:
                return {"success": False, "message": "Failed to update password"}
                
        except Exception as e:
            logger.error(f"Error updating password: {str(e)}")
            return {"success": False, "message": f"Update error: {str(e)}"}
    
    def delete_user(self, user_id: int) -> Dict[str, Any]:
        """Delete a user account"""
        try:
            # Delete from database
            response = self.supabase.table("users").delete().eq("id", user_id).execute()
            
            if response.data:
                # Also delete all user queries
                self.supabase.table("search_history").delete().eq("user_id", user_id).execute()
                return {"success": True, "message": "Account deleted successfully"}
            else:
                return {"success": False, "message": "Failed to delete account"}
                
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            return {"success": False, "message": f"Deletion error: {str(e)}"}
            
    def save_user_query(self, user_id: int, query: str) -> Dict[str, Any]:
        """Save a user's search query to history"""
        try:
            # Don't save empty queries
            if not query or query.strip() == "":
                logger.warning(f"Empty query not saved for user {user_id}")
                return {"success": False, "message": "Empty query not saved"}
            
            logger.info(f"Attempting to save query for user {user_id}: '{query}'")
            
            # Check for duplicates to avoid saving the same query multiple times
            existing_query = self.supabase.table("search_history").select("*").eq("user_id", user_id).eq("query", query).execute()
            
            if existing_query.data and len(existing_query.data) > 0:
                # Query already exists, no need to save again
                logger.info(f"Query already exists for user {user_id}, not saving duplicate")
                return {"success": True, "query_id": existing_query.data[0]["id"], "message": "Query already exists"}
            
            # Prepare the new query record
            new_query = {
                "user_id": user_id,
                "query": query,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            logger.info(f"Inserting new query into search_history table: {new_query}")
            response = self.supabase.table("search_history").insert(new_query).execute()
            
            if response.data:
                logger.info(f"Successfully saved query, ID: {response.data[0]['id']}")
                return {"success": True, "query_id": response.data[0]["id"]}
            else:
                logger.error(f"Failed to save query, no data returned from insert operation")
                return {"success": False, "message": "Failed to save query, no data returned"}
                
        except Exception as e:
            logger.error(f"Error saving query for user {user_id}: {str(e)}")
            # Log more details about the exception for debugging
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "message": f"Query save error: {str(e)}"}
    
    def get_user_queries(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        """Get a user's search history"""
        try:
            response = self.supabase.table("search_history").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(limit).execute()
            
            if response.data:
                return {"success": True, "queries": response.data}
            else:
                return {"success": True, "queries": []}
                
        except Exception as e:
            logger.error(f"Error fetching queries: {str(e)}")
            return {"success": False, "message": f"Query fetch error: {str(e)}"} 