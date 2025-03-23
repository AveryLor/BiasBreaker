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
import logging
import random
from typing import List, Optional, Dict, Any, Union
try:
    import jwt
except ImportError:
    # Try PyJWT if jwt is not found
    import PyJWT as jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
from api.neutrality_check import NeutralityCheck
from api.neutral_article_generator import NeutralArticleGenerator
from api.natural_language_understanding import NaturalLanguageUnderstanding

# Suppress HTTP client debug logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("h2").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)

# Set general logging to WARNING level
logging.basicConfig(level=logging.WARNING)

# Load environment variables and setup Supabase and Cohere
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Initialize clients only if credentials are available
supabase = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        print("Some functionality requiring database access will not work.")

co = None
if COHERE_API_KEY:
    try:
        co = cohere.Client(COHERE_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Cohere client: {e}")
        print("Some AI functionality will not work.")

# Initialize API modules
try:
    nlu = NaturalLanguageUnderstanding()  # Natural language understanding
    neutral_generator = NeutralArticleGenerator()  # Neutral article generator
    neutrality_checker = NeutralityCheck()  # Neutrality checker
except Exception as e:
    print(f"Warning: Could not initialize some API modules: {e}")
    print("Some advanced features may not work properly.")

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
    created_at: Optional[Union[str, datetime.datetime]] = None

    class Config:
        arbitrary_types_allowed = True

    # Add method to ensure id is always an integer
    @property
    def user_id(self) -> int:
        """Returns the user ID as an integer."""
        try:
            return int(self.id)
        except (ValueError, TypeError):
            return 0  # Default fallback ID

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
            print("Supabase not available, returning mock user")
            return User(email=email, id=1)
        
        try:
            print(f"Getting user info for email: {email}")
            user_result = supabase.table("users").select("*").eq("email", email).execute()
            
            if not user_result.data:
                print(f"User not found in database: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            user_data = user_result.data[0]
            print(f"Found user: {user_data.get('email')} with id: {user_data.get('id')}")
            
            # Create User object with id explicitly cast to int
            user = User(
                email=user_data.get("email", ""),
                id=int(user_data.get("id", 0)),
                name=user_data.get("name"),
                created_at=user_data.get("created_at")
            )
            
            print(f"Created User object with id: {user.id}, user_id: {user.user_id}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error getting user from database: {e}")
            import traceback
            traceback.print_exc()
            # Return mock user for testing purposes
            return User(email=email, id=1)
            
    except jwt.JWTError as e:
        print(f"JWT error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Unexpected error in get_current_user: {e}")
        import traceback
        traceback.print_exc()
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
            
        # Create a more specific prompt that preserves key terms from the original query
        prompt = f"""Extract exactly 5 key search terms related to this topic: "{message}"

IMPORTANT INSTRUCTIONS:
1. ALWAYS include the main important words from the original query (if they are relevant and spelled correctly)
2. If the original query has fewer than 5 main words, add related terms to reach 5 keywords
3. All keywords must be highly relevant to the query's central topic
4. Output ONLY the words separated by commas, with no additional text or explanation

Example input: "What are the effects of climate change on polar bears?"
Example output: climate change, polar bears, arctic, ice melt, habitat loss"""
            
        # Use Cohere to generate related terms
        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=50,
            temperature=0.3,
            stop_sequences=["\n"]
        )
        
        keywords = [word.strip() for word in response.generations[0].text.split(',')]
        
        # Filter out any empty keywords or non-keyword text
        keywords = [k for k in keywords if k and not k.startswith("example") and not k.startswith("output")]
        
        # Limit to exactly 5 keywords or the number of words in the original message if fewer
        min_keywords = min(5, len(message.split()))
        if len(keywords) > 5:
            keywords = keywords[:5]
        elif len(keywords) < min_keywords:
            # Add the main words from the original message if we don't have enough keywords
            message_words = [word.strip('.,?!:;()[]{}""\'') for word in message.split()]
            for word in message_words:
                if len(word) > 3 and word.lower() not in [k.lower() for k in keywords]:
                    keywords.append(word)
                    if len(keywords) >= 5:
                        break
        
        print("\nKeywords extracted:", keywords)
        print(f"Original query: '{message}'")
        return keywords
    except Exception as e:
        print("\nError in keyword extraction:", str(e))
        # Fall back to using the main words from the original message
        message_words = [word.strip('.,?!:;()[]{}""\'') for word in message.split() if len(word) > 3]
        if not message_words:
            return [message]
        return message_words[:5]

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
        neutrality_checker = NeutralityCheck()
        bias_scores_dict = {}  # Dictionary to store ID: bias_score pairs
        
        print("\nSearching for articles...")
        
        # Set a maximum number of articles to collect before selection
        max_articles_to_collect = 16
        
        for keyword in keywords:
            # Skip this keyword if we already found enough articles
            if len(all_results) >= max_articles_to_collect:
                print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                break
                
            print(f"Searching for keyword: {keyword}")
            # Try both table names to ensure compatibility
            try:
                response = supabase.table("news") \
                    .select("id, article_titles, news_information, source_link") \
                    .ilike("article_titles", f"%{keyword}%") \
                    .execute()
                    
                if not response.data and supabase:
                    # Try the alternate table name
                    response = supabase.table("articleInformationDB") \
                        .select("id, article_titles, source_name, source_link, news_information") \
                        .ilike("news_information", f"%{keyword}%") \
                        .execute()
            except Exception as e:
                print(f"Error searching first table: {e}")
                try:
                    # Try the alternate table name
                    response = supabase.table("articleInformationDB") \
                        .select("id, article_titles, source_name, source_link, news_information") \
                        .ilike("news_information", f"%{keyword}%") \
                        .execute()
                except Exception as e2:
                    print(f"Error searching second table: {e2}")
                    response = {"data": []}
            
            if response.data:
                for article in response.data:
                    # Skip if we already have this article
                    if any(r['id'] == article['id'] for r in all_results):
                        continue
                    
                    # Check which table format we're using
                    if "source_name" in article:
                        # articleInformationDB format
                        article_data = {
                            "customized_article": {
                                "title": article['article_titles'],
                                "content": article['news_information']
                            }
                        }
                        
                        neutrality_result = neutrality_checker.evaluate_neutrality(article_data)
                        bias_score = neutrality_result['bias_score']
                        
                        # Store bias score with ID
                        bias_scores_dict[article['id']] = bias_score
                        
                        all_results.append({
                            "id": article['id'],
                            "title": article['article_titles'],
                            "source": article['source_name'],
                            "content": article['news_information'],
                            "source_link": article.get('source_link', ''),
                            "bias_score": bias_score,
                            "biased_segments": neutrality_result['biased_segments']
                        })
                    else:
                        # news table format
                        article_data = {
                            "customized_article": {
                                "title": article['article_titles'],
                                "content": article['news_information']
                            }
                        }
                        
                        neutrality_result = neutrality_checker.evaluate_neutrality(article_data)
                        bias_score = neutrality_result['bias_score']
                        
                        # Store bias score with ID
                        bias_scores_dict[article['id']] = bias_score
                        
                        all_results.append({
                            "id": article['id'],
                            "title": article['article_titles'],
                            "content": article['news_information'],
                            "source_link": article.get('source_link', ''),  # Include source link
                            "bias_score": bias_score,
                            "biased_segments": neutrality_result['biased_segments']
                        })
                    
                    # Check if we've reached the maximum after adding this article
                    if len(all_results) >= max_articles_to_collect:
                        print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                        break
                
                # Break the outer loop if we already have enough articles
                if len(all_results) >= max_articles_to_collect:
                    break
            else:
                print(f"No results found for keyword '{keyword}'")

        # Print the number of articles found
        print(f"\nFound {len(all_results)} articles matching keywords")

        # Print the bias scores dictionary
        print("\nAll articles with bias scores:")
        for article_id, score in bias_scores_dict.items():
            print(f"Article ID: {article_id}, Bias Score: {score}")

        # Function to find closest articles to target scores
        def find_closest_articles(scores_dict, target_scores=[0, 25, 75, 100]):
            if len(scores_dict) <= 4:
                return {k: v for k, v in scores_dict.items()}
            
            selected_articles = {}
            # For each target score, find the closest actual score
            for target in target_scores:
                closest_id = min(scores_dict.keys(), 
                               key=lambda k: abs(scores_dict[k] - target))
                selected_articles[closest_id] = scores_dict[closest_id]
                # Remove selected article to avoid duplicates
                scores_dict = {k: v for k, v in scores_dict.items() if k != closest_id}
            
            return selected_articles

        # Get selected articles
        selected_articles_dict = find_closest_articles(bias_scores_dict.copy())
        
        # Create a list of selected articles with full data
        selected_articles = []
        
        print("\nSelected articles for diverse bias representation:")
        for article_id, score in selected_articles_dict.items():
            article = next((a for a in all_results if a['id'] == article_id), None)
            if article:
                selected_articles.append(article)
                print(f"\nTitle: {article['title']}")
                print(f"Bias Score: {score}")
                if article['biased_segments']:
                    print("Biased Segments:", ", ".join(article['biased_segments']))
        
        # Generate neutral article from selected articles
        if selected_articles and len(selected_articles) >= 1:
            # Prepare source articles info
            source_articles = []

            # Handle edge case when there might be only one article
            if len(selected_articles) >= 2:
                min_bias = min(article.get('bias_score', 0) for article in selected_articles)
                max_bias = max(article.get('bias_score', 0) for article in selected_articles)
            else:
                # For a single article, the range is just that article's bias score
                min_bias = max_bias = selected_articles[0].get('bias_score', 50)
            
            print("\nGenerating article summaries for each source article:")
            print(f"{'='*80}")
            
            for article in selected_articles:
                # Generate a summary for this article
                summary = generate_article_summary(
                    article.get('content', ''), 
                    article.get('title', 'No title')
                )
                
                # Print the article summary
                print(f"SOURCE ARTICLE: {article.get('title', 'No title')}")
                print(f"BIAS SCORE: {article.get('bias_score', 0)}")
                print(f"SOURCE LINK: {article.get('source_link', 'No link available')}")
                print("SUMMARY:")
                for bullet in summary:
                    print(f"  {bullet}")
                print(f"{'.'*50}")
                
                # Add this article with its summary to the source_articles list
                source_articles.append({
                    "id": article.get('id', 'unknown'),
                    "title": article.get('title', 'No title'),
                    "bias_score": article.get('bias_score', 0),
                    "source_link": article.get('source_link', ''),
                    "summary": summary
                })
            
            print(f"{'='*80}")
                
            # Generate neutral article
            neutral_article = neutral_generator.generate_neutral_article(selected_articles)
            
            # Add source information and bias score
            neutral_article['source_articles'] = source_articles
            neutral_article['source_count'] = len(source_articles)
            neutral_article['source_bias_range'] = f"{min_bias}-{max_bias}"
            neutral_article['bias_score'] = 50  # Neutral
            neutral_article['id'] = "neutral-generated"  # Special ID to identify this article
            
            all_results.append(neutral_article)
            
            # Print the full neutral article for testing purposes
            print(f"\n{'='*80}")
            print(f"GENERATED NEUTRAL ARTICLE:")
            print(f"{'='*80}")
            print(f"TITLE: {neutral_article['title']}")
            print(f"{'='*80}")
            print(neutral_article['content'])
            print(f"{'='*80}")
            print(f"SOURCE COUNT: {len(source_articles)}")
            print(f"SOURCE BIAS RANGE: {min_bias}-{max_bias}")
            print(f"{'='*80}\n")
        
        print(f"Total unique articles found: {len(all_results)}")
        return all_results
            
    except Exception as e:
        print(f"Error searching articles: {str(e)}")
        return []

@app.post("/api/chat")
def receive_chat(chat_input: ChatInput):
    try:
        print(f"\n{'#'*50}")
        print(f"PROCESSING QUERY: '{chat_input.message}'")
        print(f"{'#'*50}")
        
        # Extract keywords from the query
        keywords = extract_keywords(chat_input.message)
        
        # Calculate keyword relevance to original query
        query_words = set(word.lower().strip('.,?!:;()[]{}""\'') for word in chat_input.message.split() if len(word) > 3)
        keyword_overlap = [k for k in keywords if any(query_word in k.lower() or k.lower() in query_word for query_word in query_words)]
        
        # Log keyword relevance
        print(f"\nKeyword relevance analysis:")
        print(f"Main words in query: {', '.join(query_words)}")
        print(f"Keywords matching query: {', '.join(keyword_overlap)}")
        print(f"Match percentage: {len(keyword_overlap)/len(keywords)*100:.1f}% of keywords match query terms")
        
        # Search for articles using the keywords
        search_results = search_articles(keywords)
        
        # Find generated neutral article if it exists
        neutral_article = next((article for article in search_results 
                               if article.get('id') == 'neutral-generated'), None)
        
        # Other articles (excluding the neutral article)
        regular_articles = [article for article in search_results 
                           if article.get('id') != 'neutral-generated']
        
        # Prepare response
        response = {
            "status": "success",
            "query": chat_input.message,
            "keywords": keywords,
            "keyword_analysis": {
                "query_main_words": list(query_words),
                "matching_keywords": keyword_overlap,
                "match_percentage": round(len(keyword_overlap)/max(1, len(keywords))*100, 1)
            },
            "results": regular_articles,
            "neutral_article": neutral_article
        }
        
        if search_results:
            neutral_msg = " and generated a neutral article" if neutral_article else ""
            response["message"] = f"Found {len(regular_articles)} articles{neutral_msg}"
            
            # Include source information if we have a neutral article
            if neutral_article and 'source_articles' in neutral_article:
                # Map source articles to include the summaries
                source_articles_with_summaries = []
                
                for source in neutral_article.get('source_articles', []):
                    source_articles_with_summaries.append({
                        "id": source.get('id', 'unknown'),
                        "title": source.get('title', 'No title'),
                        "bias_score": source.get('bias_score', 0),
                        "source_link": source.get('source_link', ''),
                        "summary": source.get('summary', [
                            "• Summary not available",
                            "• Please see full article",
                            "• For more details"
                        ])
                    })
                
                response["sources"] = {
                    "count": neutral_article.get("source_count", len(neutral_article['source_articles'])),
                    "bias_range": neutral_article.get("source_bias_range", "Unknown"),
                    "articles": source_articles_with_summaries
                }
                
                # Print a summary of the sources with their summaries
                print("\nSORTED SOURCE ARTICLES WITH SUMMARIES:")
                # Sort by bias score for better presentation
                sorted_sources = sorted(source_articles_with_summaries, key=lambda x: x.get('bias_score', 0))
                for idx, source in enumerate(sorted_sources, 1):
                    print(f"\nSOURCE {idx}: '{source.get('title')}'")
                    print(f"  Bias Score: {source.get('bias_score', 0)}")
                    print(f"  Link: {source.get('source_link', 'No link available')}")
                    for bullet in source.get('summary', []):
                        print(f"  {bullet}")
        else:
            response["message"] = "No articles found"
        
        # Print summary of the API response
        print(f"\n{'*'*50}")
        print(f"API RESPONSE SUMMARY:")
        print(f"{'*'*50}")
        print(f"Status: {response['status']}")
        print(f"Message: {response['message']}")
        print(f"Query: '{chat_input.message}'")
        print(f"Keywords: {', '.join(keywords)}")
        print(f"Keyword match: {response['keyword_analysis']['match_percentage']}% overlap with query")
        print(f"Regular article count: {len(regular_articles)}")
        print(f"Neutral article: {'Generated' if neutral_article else 'None'}")
        print(f"{'*'*50}\n")
            
        return response
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {
            "status": "error",
            "message": "An error occurred",
            "query": chat_input.message,
            "results": [],
            "neutral_article": None
        }

@app.post("/api/articles/search")
async def search_articles_endpoint(search_input: ArticleSearchInput, current_user: User = Depends(get_current_user_or_none), request: Request = None):
    try:
        print(f"Searching for articles about: {search_input.topic}")
        
        # Debug auth headers
        if request:
            auth_header = request.headers.get('authorization')
            print(f"Auth header present: {auth_header is not None}")
            if auth_header:
                token_type, token = auth_header.split()
                print(f"Token type: {token_type}, Token (first 10 chars): {token[:10]}...")
        
        print(f"Current user: {current_user}")
        
        # Extract keywords from the topic
        try:
            keywords = extract_keywords(search_input.topic)
            print(f"Generated keywords: {keywords}")
        except Exception as e:
            import traceback
            print(f"Error extracting keywords: {e}")
            print(traceback.format_exc())
            keywords = [search_input.topic]  # Use the original query as fallback
        
        # Record search history if user is authenticated
        if current_user:
            try:
                # Use the user_id property which always returns a valid integer
                user_id = current_user.user_id
                print(f"Recording search history for user: {user_id}")
                
                search_data = {
                    "user_id": user_id,
                    "query": search_input.topic,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
                
                print(f"Search data to be inserted: {search_data}")
                
                if supabase:
                    print(f"Inserting into search_history table: {search_data}")
                    try:
                        # First check if the table exists
                        try:
                            supabase.table("search_history").select("id").limit(1).execute()
                            print("Confirmed search_history table exists")
                        except Exception as table_e:
                            print(f"Error checking search_history table: {table_e}")
                            print("The search_history table might not exist. Search history will not be recorded.")
                            print("Please run create_search_history_table.py to create the table.")
                            # Continue with the search even if we can't record history
                            raise Exception("search_history table does not exist")
                        
                        # If we got here, the table exists, so try to insert
                        result = supabase.table("search_history").insert(search_data).execute()
                        print(f"Search history recorded for user {user_id}: {search_input.topic}")
                        print(f"Supabase response: {result}")
                    except Exception as e:
                        import traceback
                        print(f"Error inserting into search_history: {e}")
                        print(traceback.format_exc())
                else:
                    print("Supabase client not available, search history not recorded")
            except Exception as e:
                import traceback
                print(f"Error recording search history: {e}")
                print(traceback.format_exc())
                # Continue with search even if recording history fails
        else:
            print("User not authenticated, search history not recorded")
        
        # Search for articles
        try:
            articles_data = search_articles(keywords)
            print(f"Found {len(articles_data)} articles")
        except Exception as e:
            import traceback
            print(f"Error searching for articles: {e}")
            print(traceback.format_exc())
            articles_data = []  # Empty list as fallback
        
        # Transform data to match frontend's expected format
        formatted_articles = []
        try:
            for idx, article in enumerate(articles_data):
                # Create excerpt from content
                try:
                    excerpt = article.get('article_content', '')[:200] + '...' if article.get('article_content') else 'No content available'
                except Exception as excerpt_e:
                    print(f"Error creating excerpt: {excerpt_e}")
                    excerpt = "Excerpt unavailable"
                
                # Determine the perspective
                try:
                    perspective = classify_perspective(article.get('source', ''), article.get('article_content', ''))
                except Exception as perspective_e:
                    print(f"Error classifying perspective: {perspective_e}")
                    perspective = "neutral"
                
                formatted_article = {
                    "id": article.get('id', idx + 1),
                    "source": article.get('source', 'Unknown Source'),
                    "title": article.get('title', 'Untitled Article'),
                    "excerpt": excerpt,
                    "perspective": perspective,
                    "date": "Recent", # No date in DB schema
                    "url": article.get('source_link', '#')
                }
                formatted_articles.append(formatted_article)
        except Exception as format_e:
            import traceback
            print(f"Error formatting articles: {format_e}")
            print(traceback.format_exc())
        
        return {
            "status": "success",
            "message": f"Found {len(formatted_articles)} articles",
            "results": formatted_articles
        }
    except Exception as e:
        import traceback
        print(f"Unhandled error in search_articles_endpoint: {e}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": "An unexpected error occurred",
            "results": []
        }

@app.get("/api/welcome-text")
def get_welcome_text():
    return {
        "title": "Welcome from Backend!",
        "description": "This text is coming from your FastAPI backend server."
    }

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and provide JWT token"""
    try:
        # Check if Supabase client is available
        if not supabase:
            # For testing without DB access
            print("Warning: Supabase not available, using hardcoded test user")
            if form_data.username == "test@example.com" and form_data.password == "password123":
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": form_data.username}, expires_delta=access_token_expires
                )
                return {"access_token": access_token, "token_type": "bearer"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        print(f"Attempting login for user: {form_data.username}")
        
        # Find user in database
        user_result = supabase.table("users").select("*").eq("email", form_data.username).execute()
        
        if not user_result.data:
            print(f"User not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_data = user_result.data[0]
        stored_hash = user_data.get("hashed_password")
        
        if not verify_password(form_data.password, stored_hash):
            print(f"Invalid password for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Password is correct, generate token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires
        )
        
        print(f"Generated token for user: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.post("/users/", response_model=User)
async def register_user(user: UserCreate):
    """Register a new user"""
    try:
        # Check if Supabase client is available
        if not supabase:
            print("Warning: Supabase not available, cannot register user")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection not available"
            )
            
        # Check if email already exists
        user_check = supabase.table("users").select("*").eq("email", user.email).execute()
        
        if user_check.data:
            print(f"Email already registered: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Hash the password
        hashed_password = get_password_hash(user.password)
        
        # Create user data
        user_data = {
            "email": user.email,
            "hashed_password": hashed_password,
            "name": user.name or "",
        }
        
        print(f"Creating new user: {user.email}")
        
        # Insert new user
        result = supabase.table("users").insert(user_data).execute()
        
        if not result.data:
            print("Error: No data returned from user creation")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
            
        new_user = result.data[0]
        print(f"New user created with ID: {new_user['id']}")
        
        # Return user data without password
        return User(
            id=new_user["id"],
            email=new_user["email"],
            name=new_user.get("name", ""),
            created_at=new_user.get("created_at", "")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"User registration error: {error_msg}")
        import traceback
        traceback.print_exc()
        
        if "users" in error_msg and "does not exist" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error: users table does not exist"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {error_msg}"
            )

@app.get("/users/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user

@app.get("/")
def root():
    return {"status": "API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)


# variables: keywords 