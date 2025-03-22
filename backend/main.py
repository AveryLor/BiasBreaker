import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import sys
import os

# Add API directory to Python path for importing modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import API modules
from api.natural_language_understanding import NaturalLanguageUnderstanding
from api.generative_news_synthesis import GenerativeNewsSynthesis
from api.underrepresented_voices import UnderrepresentedVoices
from api.dei_focus import DEIFocus
from api.user_customization import UserCustomization
from api.neutrality_check import NeutralityCheck
from api.database import Database

# Load environment variables
load_dotenv()

app = FastAPI(title="GenesisAI News API", description="API for balanced news synthesis with DEI focus")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize Supabase client
def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    return create_client(supabase_url, supabase_key)

# Initialize the shared Supabase client at startup
supabase_client = None

@app.on_event("startup")
async def startup_event():
    """Initialize shared Supabase client and connect it to the Database class."""
    global supabase_client
    try:
        supabase_client = get_supabase_client()
        # Set the backend client in the Database class
        Database.set_backend_client(supabase_client)
    except Exception as e:
        print(f"Error initializing Supabase client: {str(e)}")

# Use the shared client for FastAPI dependencies
def get_shared_client() -> Client:
    """Return the shared Supabase client for dependency injection."""
    if supabase_client is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    return supabase_client

# Table name constant
TABLE_NAME = "news"  # Use the exact table name without any prefix

# Initialize API modules
nlp = NaturalLanguageUnderstanding()
news_synthesis = GenerativeNewsSynthesis()
voices = UnderrepresentedVoices()
dei = DEIFocus()
customization = UserCustomization()
neutrality = NeutralityCheck()

# Pydantic models
class NewsArticle(BaseModel):
    id: int
    source_name: str
    source_link: str
    news_information: str
    # Add any other fields that exist in the news table

class NewsQuery(BaseModel):
    query: str

class SynthesisRequest(BaseModel):
    article_ids: List[int]

class DEICustomization(BaseModel):
    settings: Dict[str, Any]
    article_data: Dict[str, Any]

# Routes
@app.get("/")
def root():
    return {"message": "Welcome to GenesisAI News API"}

@app.get("/news", response_model=List[NewsArticle])
async def get_all_news(supabase: Client = Depends(get_shared_client)):
    """Get all news articles from the database"""
    try:
        try:
            print(f"Attempting to query table: {TABLE_NAME}")
            response = supabase.table(TABLE_NAME).select("*").execute()
            print(f"Query successful, found {len(response.data)} records")
            return response.data
        except Exception as e:
            # Print detailed error information for debugging
            print(f"Detailed database error in get_all_news: {str(e)}")
            
            # Fallback to testing if the table exists
            try:
                # Try to get just one record to see if the table exists
                print(f"Testing if table '{TABLE_NAME}' exists")
                test_response = supabase.table(TABLE_NAME).select("*").limit(1).execute()
                # If we get here, table exists but there's some other issue
                print(f"Table exists, found {len(test_response.data)} records")
                return []
            except Exception as table_error:
                if "does not exist" in str(table_error):
                    # Table doesn't exist, provide more helpful error
                    print(f"Table '{TABLE_NAME}' does not exist in the database: {str(table_error)}")
                    # Return empty list instead of error
                    return []
                else:
                    # Some other database error
                    print(f"Database error checking table: {str(table_error)}")
                    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in get_all_news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/news/{news_id}", response_model=NewsArticle)
async def get_news_by_id(news_id: int, supabase: Client = Depends(get_shared_client)):
    """Get a specific news article by ID"""
    try:
        response = supabase.table(TABLE_NAME).select("*").eq("id", news_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail=f"News article with ID {news_id} not found")
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/analyze-query")
async def analyze_query(query_data: NewsQuery):
    """Analyze a user query using NLU module"""
    try:
        analysis = nlp.process_query(query_data.query)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/synthesize")
async def synthesize_articles(request: SynthesisRequest, supabase: Client = Depends(get_shared_client)):
    """Synthesize multiple news articles into a balanced narrative"""
    try:
        # Fetch articles from database
        articles = []
        for article_id in request.article_ids:
            response = supabase.table(TABLE_NAME).select("*").eq("id", article_id).execute()
            if response.data:
                article = response.data[0]
                articles.append({
                    "title": article["source_name"],
                    "content": article["news_information"]
                })
        
        if not articles:
            raise HTTPException(status_code=404, detail="No valid articles found")
        
        # Synthesize articles
        synthesis_result = news_synthesis.synthesize_articles(articles)
        return synthesis_result
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Synthesis error: {str(e)}")

@app.post("/identify-voices")
async def identify_underrepresented(article_data: Dict[str, Any]):
    """Identify underrepresented voices in a synthesized article"""
    try:
        result = voices.identify_underrepresented_perspectives(article_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/emphasize-dei")
async def emphasize_dei(article_data: Dict[str, Any]):
    """Emphasize DEI in a synthesized article"""
    try:
        result = dei.emphasize_dei(article_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/customize")
async def customize_article(request: DEICustomization):
    """Customize DEI emphasis based on user preferences"""
    try:
        result = customization.customize_dei_emphasis(request.article_data, request.settings)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Customization error: {str(e)}")

@app.post("/check-neutrality")
async def check_neutrality(article_data: Dict[str, Any]):
    """Check the neutrality of an article"""
    try:
        result = neutrality.evaluate_neutrality(article_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")

# Add a new endpoint to search articles by keywords
@app.get("/search", response_model=List[NewsArticle])
async def search_articles(query: str, supabase: Client = Depends(get_shared_client)):
    """Search articles in the news_information column for matching keywords"""
    try:
        print(f"Searching for: {query}")
        # Use Supabase's search capabilities - 'ilike' for case-insensitive matching
        response = supabase.table(TABLE_NAME) \
            .select("*") \
            .ilike("news_information", f"%{query}%") \
            .execute()
        
        print(f"Search successful, found {len(response.data)} matching articles")
        return response.data
    except Exception as e:
        print(f"Error searching articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)