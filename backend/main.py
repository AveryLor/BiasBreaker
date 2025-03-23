import os
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import cohere  # Add this import
import datetime
from datetime import timedelta
import json
import re
import supabase
from typing import List, Optional, Dict, Any, Union
try:
    import jwt
except ImportError:
    # Try PyJWT if jwt is not found
    import PyJWT as jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from fastapi.responses import JSONResponse

# Load environment variables and setup Supabase and Cohere
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
cohere_api_key = os.getenv("COHERE_API_KEY")  # Add this line

# Initialize clients only if credentials are available
supabase = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        print("Some functionality requiring database access will not work.")

co = None
if cohere_api_key:
    try:
        co = cohere.Client(cohere_api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Cohere client: {e}")
        print("Some AI functionality will not work.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    message: str

class ArticleSearchInput(BaseModel):
    topic: str

# Authentication models
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserInDB(BaseModel):
    id: int
    email: str
    hashed_password: str
    name: Optional[str] = None
    created_at: Union[str, datetime.datetime]

    class Config:
        arbitrary_types_allowed = True

class User(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    created_at: Union[str, datetime.datetime]

    class Config:
        arbitrary_types_allowed = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Authentication utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
# Optional OAuth2 scheme that doesn't require authentication
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY_HERE")  # Should be stored in environment variable in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.datetime.utcnow() + expires_delta
        else:
            expire = datetime.datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        print(f"Error creating access token: {e}")
        # Return a default token for testing purposes
        return "test_token"

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("Token payload doesn't contain username")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Get user from database
        if not supabase:
            # For testing without Supabase
            return User(email=email, id=1)
        
        user_result = supabase.table("users").select("*").eq("email", email).execute()
        if not user_result.data:
            print(f"User not found in database: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_data = user_result.data[0]
        
        return User(
            email=user_data["email"],
            id=user_data["id"]
        )
    except jwt.JWTError as e:
        print(f"JWT error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Unexpected error in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

# Function to get the current user or None if not authenticated
async def get_current_user_or_none(token: Optional[str] = Depends(oauth2_scheme_optional)):
    if not token:
        return None
        
    try:
        return await get_current_user(token)
    except HTTPException:
        return None
        
# Function to classify political perspective based on source and content
def classify_perspective(source, content):
    # This is a simplified mapping of news sources to perspectives
    source_perspective_map = {
        "BBC News": "Centrist",
        "Reuters": "Centrist", 
        "Associated Press": "Centrist",
        "CNN": "Liberal",
        "MSNBC": "Liberal",
        "The Guardian": "Liberal",
        "New York Times": "Liberal",
        "Washington Post": "Liberal",
        "Fox News": "Conservative",
        "Daily Mail": "Conservative",
        "New York Post": "Conservative",
        "Wall Street Journal": "Conservative",
        "Al Jazeera": "Progressive",
        "The Intercept": "Progressive",
        "Reason": "Libertarian"
    }
    
    # Return perspective if source is in our map
    if source in source_perspective_map:
        return source_perspective_map[source]
    
    # Default to "Centrist" if source is unknown
    return "Centrist"

def extract_keywords(message):
    try:
        # Check if Cohere client is available
        if not co:
            print("Cohere client not available, returning original message as keyword")
            # Return the message itself as the keyword if Cohere is not available
            return [message]
            
        # Use Cohere to generate related terms
        response = co.generate(
            model='command',
            prompt=f"Extract 5 key search terms related to this topic: {message}\nOutput only the words separated by commas:",
            max_tokens=50,
            temperature=0.3,
            stop_sequences=["\n"]
        )
        
        # Clean and split the generated keywords
        keywords = [word.strip() for word in response.generations[0].text.split(',')]
        print(f"Generated keywords: {keywords}")
        return keywords
    except Exception as e:
        print(f"Error generating keywords: {str(e)}")
        return [message]  # Fallback to original message if error

def search_articles(keywords):
    try:
        # Check if Supabase is available
        if not supabase:
            print("Supabase client not available, returning mock article data")
            # Return mock data for testing
            return [
                {
                    "id": 1,
                    "title": "Climate Change: An Overview",
                    "source": "Mock Science Journal",
                    "article_content": "Climate change is the long-term alteration of temperature and typical weather patterns in a place. Climate change could refer to a particular location or the planet as a whole. Climate change has been connected with damaging weather events such as more frequent and more intense hurricanes, floods, downpours, and winter storms.",
                    "source_link": "https://example.com/climate-1",
                    "published_date": datetime.datetime.now().isoformat()
                },
                {
                    "id": 2,
                    "title": "The Effects of Climate Change on Ecosystems",
                    "source": "Mock Environmental Review",
                    "article_content": "The Earth's climate has changed throughout history. Just in the last 650,000 years there have been seven cycles of glacial advance and retreat, with the abrupt end of the last ice age about 11,700 years ago marking the beginning of the modern climate era — and of human civilization.",
                    "source_link": "https://example.com/climate-2",
                    "published_date": datetime.datetime.now().isoformat()
                },
                {
                    "id": 3,
                    "title": "Global Initiatives to Combat Climate Change",
                    "source": "Mock Policy Gazette",
                    "article_content": "Various global initiatives have been established to combat climate change, including the Paris Agreement, which aims to limit global warming to well below 2 degrees Celsius above pre-industrial levels. Countries around the world are implementing policies to reduce greenhouse gas emissions.",
                    "source_link": "https://example.com/climate-3",
                    "published_date": datetime.datetime.now().isoformat()
                }
            ]

        all_results = []
        print(f"Searching for articles with keywords: {keywords}")
        
        # Search for each keyword
        for keyword in keywords:
            print(f"Searching for keyword: {keyword}")
            response = supabase.table("articleInformationDB") \
                .select("id, article_titles, source_name, source_link, news_information") \
                .ilike("news_information", f"%{keyword}%") \
                .execute()
            
            print(f"Found {len(response.data)} results for keyword '{keyword}'")
            
            if response.data:
                for article in response.data:
                    # Avoid duplicates
                    if not any(r['id'] == article['id'] for r in all_results):
                        print(f"Adding article: {article['article_titles']}")
                        all_results.append({
                            "id": article['id'],
                            "title": article['article_titles'],
                            "source": article['source_name'],
                            "article_content": article['news_information'],
                            "source_link": article['source_link'],
                            # No published date in the schema, use current date
                            "published_date": datetime.datetime.now().isoformat()
                        })
            else:
                print(f"No results found for keyword '{keyword}'")
                
        print(f"Total unique articles found: {len(all_results)}")
        return all_results
            
    except Exception as e:
        print(f"Error searching articles: {str(e)}")
        # Return mock data as fallback
        return [
            {
                "id": 1,
                "title": "Error Retrieving Articles",
                "source": "System",
                "article_content": f"There was an error searching for articles: {str(e)}. Please try again later.",
                "source_link": "https://example.com/error",
                "published_date": datetime.datetime.now().isoformat()
            }
        ]

@app.post("/api/chat")
def receive_chat(chat_input: ChatInput):
    try:
        print(f"Received chat message: {chat_input.message}")
        # Extract keywords using Cohere
        keywords = extract_keywords(chat_input.message)
        print(f"Successfully extracted keywords: {keywords}")
        
        # Search for articles using the extracted keywords
        search_results = search_articles(keywords)
        print(f"Search completed. Found {len(search_results)} results")
        
        if search_results:
            return {
                "status": "success",
                "message": f"Found {len(search_results)} articles",
                "results": search_results
            }
        else:
            return {
                "status": "success",
                "message": "No articles found",
                "results": []
            }
    except Exception as e:
        print(f"Error in receive_chat: {str(e)}")
        return {
            "status": "error",
            "message": "An error occurred",
            "results": []
        }

@app.post("/api/articles/search")
async def search_articles_endpoint(search_input: ArticleSearchInput, current_user: User = Depends(get_current_user_or_none)):
    try:
        print(f"Searching for articles about: {search_input.topic}")
        
        # Extract keywords from the topic
        keywords = extract_keywords(search_input.topic)
        print(f"Generated keywords: {keywords}")
        
        # Record search history if user is authenticated
        if current_user:
            try:
                search_data = {
                    "user_id": current_user.id,
                    "query": search_input.topic,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
                
                if supabase:
                    result = supabase.table("search_history").insert(search_data).execute()
                    print(f"Search history recorded for user {current_user.id}: {search_input.topic}")
            except Exception as e:
                print(f"Error recording search history: {e}")
                # Continue with search even if recording history fails
        
        # Search for articles
        articles_data = search_articles(keywords)
        
        # Transform data to match frontend's expected format
        formatted_articles = []
        for idx, article in enumerate(articles_data):
            # Create excerpt from content
            excerpt = article.get('article_content', '')[:200] + '...' if article.get('article_content') else 'No content available'
            
            # Determine the perspective
            perspective = classify_perspective(article.get('source', ''), article.get('article_content', ''))
            
            formatted_articles.append({
                "id": article.get('id', idx + 1),
                "source": article.get('source', 'Unknown Source'),
                "title": article.get('title', 'Untitled Article'),
                "excerpt": excerpt,
                "perspective": perspective,
                "date": "Recent", # No date in DB schema
                "url": article.get('source_link', f"https://example.com/article/{article.get('id', idx + 1)}")
            })
        
        # Create merged article data
        sources_considered = list(set([article.get('source', 'Unknown') for article in articles_data]))
        
        response = {
            "articles": formatted_articles,
            "mergedArticle": {
                "title": f"{search_input.topic}: A Comprehensive Analysis",
                "summary": f"This is an AI-generated summary about {search_input.topic} based on {len(formatted_articles)} articles from various sources. The analysis reveals different perspectives on this topic...",
                "sourcesConsidered": sources_considered
            }
        }
        
        return response
    except Exception as e:
        print(f"Error in search_articles_endpoint: {str(e)}")
        return {
            "status": "error",
            "message": "An error occurred while searching for articles",
            "articles": [],
            "mergedArticle": {
                "title": "Error",
                "summary": "An error occurred while generating the summary.",
                "sourcesConsidered": []
            }
        }

@app.get("/api/welcome-text")
def get_welcome_text():
    return {
        "title": "Welcome from Backend!",
        "description": "This text is coming from your FastAPI backend server."
    }

@app.get("/")
def root():
    return {"status": "API is running"}

# User routes
@app.post("/users/", response_model=User)
async def create_user(user: UserCreate):
    try:
        if not supabase:
            # Mock user creation
            return User(
                id=1,
                email=user.email,
                name=user.name,
                created_at=datetime.datetime.now()
            )
            
        # Check if user already exists
        result = supabase.table("users").select("*").eq("email", user.email).execute()
        if result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user.password)
        
        # Create user in Supabase
        try:
            user_data = {
                "email": user.email,
                "hashed_password": hashed_password,
                "name": user.name
            }
            
            result = supabase.table("users").insert(user_data).execute()
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
            
            created_user = result.data[0]
            return User(
                id=created_user["id"],
                email=created_user["email"],
                name=created_user.get("name"),
                created_at=created_user["created_at"]
            )
        except Exception as e:
            error_msg = str(e)
            # Check if the error is about missing table
            if "relation" in error_msg and "does not exist" in error_msg:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "detail": "Database setup incomplete. The users table does not exist in Supabase. Please create the required tables before continuing."
                    }
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {error_msg}"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

def authenticate_user(email: str, password: str):
    """Verify username and password."""
    try:
        if not supabase:
            # For testing without Supabase
            # Return a mock user
            return {"email": email, "id": 1}
            
        # Query the user from Supabase
        result = supabase.table("users").select("*").eq("email", email).execute()
        if not result.data:
            print(f"User not found: {email}")
            return None
        
        user_data = result.data[0]
        
        # Verify password
        if not verify_password(password, user_data["hashed_password"]):
            print(f"Invalid password for user: {email}")
            return None
        
        return user_data
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            print(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires
        )
        print(f"Successful login for user: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Error in login endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during authentication: {str(e)}"
        )

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    try:
        print(f"Fetching user profile for: {current_user.email}")
        # Return the current user directly
        return current_user
    except Exception as e:
        print(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

# User search history
@app.post("/search-history/")
async def record_search(query: str, current_user: User = Depends(get_current_user)):
    try:
        if not supabase:
            # Mock response
            return {"status": "success"}
            
        search_data = {
            "user_id": current_user.id,
            "query": query,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        result = supabase.table("search_history").insert(search_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record search"
            )
        
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error recording search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/search-history/")
async def get_search_history(current_user: User = Depends(get_current_user)):
    try:
        if not supabase:
            # Return mock data
            return [
                {"id": 1, "user_id": current_user.id, "query": "Sample search 1", "timestamp": datetime.datetime.utcnow().isoformat()},
                {"id": 2, "user_id": current_user.id, "query": "Sample search 2", "timestamp": datetime.datetime.utcnow().isoformat()}
            ]
            
        result = supabase.table("search_history").select("*").eq("user_id", current_user.id).order("timestamp", desc=True).execute()
        return result.data
    except Exception as e:
        print(f"Error getting search history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

# User political leaning
@app.get("/political-leaning/")
async def get_political_leaning(current_user: User = Depends(get_current_user)):
    # This would be a real calculation based on user's reading history
    # For demo purposes, we're returning fake data
    return {
        "left": 12,
        "center_left": 19,
        "center": 25,
        "center_right": 17,
        "right": 10
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


# variables: keywords 