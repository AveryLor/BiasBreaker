import os
import uvicorn
from api.neutrality_check import NeutralityCheck
from api.neutral_article_generator import NeutralArticleGenerator
from fastapi import FastAPI, HTTPException, Depends, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import cohere
import logging
import json
import random
from typing import List, Dict, Any, Optional
from api.auth import Auth, UserCreate, UserLogin
import jwt as pyjwt
from datetime import datetime, timedelta

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

supabase = create_client(supabase_url, supabase_key)
cohere_client = cohere.Client(COHERE_API_KEY)

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-for-jwt-tokens")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24 * 7  # 1 week

# Import custom API modules
from api.neutrality_check import NeutralityCheck
from api.neutral_article_generator import NeutralArticleGenerator
from api.natural_language_understanding import NaturalLanguageUnderstanding

# Initialize API clients
nlu = NaturalLanguageUnderstanding()  # Don't pass cohere_client
neutral_generator = NeutralArticleGenerator()  # Initialize the neutral article generator
auth_manager = Auth(supabase)  # Initialize auth manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    message: str

# Authentication related functions and classes
class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

async def get_current_user(access_token: Optional[str] = Cookie(None)):
    if not access_token:
        print("Authentication failed: No access_token cookie provided")
        return None
    
    try:
        payload = pyjwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            print("Authentication failed: JWT payload missing 'sub' field")
            return None
        
        user = auth_manager.get_user_by_id(int(user_id))
        if not user:
            print(f"Authentication failed: No user found with ID {user_id}")
            return None
        
        print(f"User authenticated successfully: {user['name']} (ID: {user['id']})")
        return user
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return None

def extract_keywords(message):
    try:
        # Create a more specific prompt that preserves key terms from the original query
        prompt = f"""Extract exactly 5 key search terms related to this topic: "{message}"

IMPORTANT INSTRUCTIONS:
1. ALWAYS include the main important words from the original query (if they are relevant and spelled correctly)
2. If the original query has fewer than 5 main words, add related terms to reach 5 keywords
3. All keywords must be highly relevant to the query's central topic
4. Output ONLY the words separated by commas, with no additional text or explanation

Example input: "What are the effects of climate change on polar bears?"
Example output: climate change, polar bears, arctic, ice melt, habitat loss"""

        response = cohere_client.generate(
            model='command',
            prompt=prompt,
            max_tokens=50,
            temperature=0.3,
            stop_sequences=["\n"]
        )
        
        cohere_keywords = [word.strip() for word in response.generations[0].text.split(',')]
        
        # Filter out any empty keywords or non-keyword text
        cohere_keywords = [k for k in cohere_keywords if k and not k.startswith("example") and not k.startswith("output")]
        
        # Extract significant words from the original message (words with 3+ characters)
        original_words = [word.strip('.,?!:;()[]{}""\'').lower() for word in message.split() if len(word.strip('.,?!:;()[]{}""\'')) > 3]
        
        # Identify keywords that come directly from the original prompt
        keywords_with_source = []
        
        # First add keywords from the original prompt
        for keyword in cohere_keywords:
            is_from_original = False
            for original_word in original_words:
                # Check if keyword contains original word or vice versa
                if original_word in keyword.lower() or keyword.lower() in original_word:
                    is_from_original = True
                    break
            
            keywords_with_source.append({
                "keyword": keyword,
                "from_original": is_from_original
            })
        
        # If we have fewer than 5 keywords, add important words from the original message
        if len(keywords_with_source) < 5:
            for word in original_words:
                if not any(word.lower() in k["keyword"].lower() or k["keyword"].lower() in word.lower() for k in keywords_with_source):
                    keywords_with_source.append({
                        "keyword": word,
                        "from_original": True
                    })
                    if len(keywords_with_source) >= 5:
                        break
        
        # Limit to exactly 5 keywords, prioritizing ones from the original message
        keywords_with_source.sort(key=lambda x: 0 if x["from_original"] else 1)
        keywords_with_source = keywords_with_source[:5]
        
        # Log the keywords and their sources
        print("\nKeywords extracted:")
        for k in keywords_with_source:
            source = "ORIGINAL" if k["from_original"] else "GENERATED"
            print(f"  {k['keyword']} [{source}]")
        
        print(f"Original query: '{message}'")
        
        # Return both the keywords and their source information
        return keywords_with_source
        
    except Exception as e:
        print("\nError in keyword extraction:", str(e))
        # Fall back to using the main words from the original message
        message_words = [word.strip('.,?!:;()[]{}""\'') for word in message.split() if len(word.strip('.,?!:;()[]{}""\'')) > 3]
        if not message_words:
            return [{"keyword": message, "from_original": True}]
        
        return [{"keyword": word, "from_original": True} for word in message_words[:5]]

def search_articles(keywords_with_source):
    try:
        all_results = []
        neutrality_checker = NeutralityCheck()
        bias_scores_dict = {}  # Dictionary to store ID: bias_score pairs
        
        print("\nSearching for articles...")
        
        # Set a maximum number of articles to collect before selection
        max_articles_to_collect = 6
        
        # First, search using keywords from the original prompt
        original_keywords = [k["keyword"] for k in keywords_with_source if k["from_original"]]
        generated_keywords = [k["keyword"] for k in keywords_with_source if not k["from_original"]]
        
        print("\nPrioritizing search with original keywords:", original_keywords)
        
        # First search with original keywords
        for keyword in original_keywords:
            # Skip this keyword if we already found enough articles
            if len(all_results) >= max_articles_to_collect:
                print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                break
                
            response = supabase.table("articleInformationDB") \
                .select("id, article_titles, news_information, source_link") \
                .ilike("article_titles", f"%{keyword}%") \
                .execute()
            
            if response.data:
                for article in response.data:
                    # Skip if we already have this article
                    if any(r['id'] == article['id'] for r in all_results):
                        continue
                        
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
                        "biased_segments": neutrality_result['biased_segments'],
                        "matched_keyword": keyword,
                        "keyword_source": "original"
                    })
                    
                    # Check if we've reached the maximum after adding this article
                    if len(all_results) >= max_articles_to_collect:
                        print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                        break
        
        # Then search with generated keywords if we still need more articles
        if len(all_results) < max_articles_to_collect and generated_keywords:
            print("\nSupplementing search with generated keywords:", generated_keywords)
            
            for keyword in generated_keywords:
                # Skip this keyword if we already found enough articles
                if len(all_results) >= max_articles_to_collect:
                    print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                    break
                    
                response = supabase.table("articleInformationDB") \
                    .select("id, article_titles, news_information, source_link") \
                    .ilike("article_titles", f"%{keyword}%") \
                    .execute()
                
                if response.data:
                    for article in response.data:
                        # Skip if we already have this article
                        if any(r['id'] == article['id'] for r in all_results):
                            continue
                            
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
                            "biased_segments": neutrality_result['biased_segments'],
                            "matched_keyword": keyword,
                            "keyword_source": "generated"
                        })
                        
                        # Check if we've reached the maximum after adding this article
                        if len(all_results) >= max_articles_to_collect:
                            print(f"\nReached {max_articles_to_collect} articles. Stopping search.")
                            break
                    
                    # Break the outer loop if we already have enough articles
                    if len(all_results) >= max_articles_to_collect:
                        break

        # Print the number of articles found
        print(f"\nFound {len(all_results)} articles matching keywords")
        original_matches = sum(1 for a in all_results if a.get('keyword_source') == 'original')
        generated_matches = sum(1 for a in all_results if a.get('keyword_source') == 'generated')
        print(f"  {original_matches} from original keywords")
        print(f"  {generated_matches} from generated keywords")

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
        
        return all_results
            
    except Exception as e:
        print("\nError in article search:", str(e))
        return []

@app.post("/api/chat")
def receive_chat(chat_input: ChatInput, user = Depends(get_current_user)):
    try:
        print(f"\n{'#'*50}")
        print(f"PROCESSING QUERY: '{chat_input.message}'")
        print(f"{'#'*50}")
        
        # Save query to user history if user is authenticated
        if user:
            print(f"User authenticated: ID {user['id']}, saving query to search history")
            save_result = auth_manager.save_user_query(user["id"], chat_input.message)
            if save_result["success"]:
                print(f"Successfully saved query to search history. Query ID: {save_result.get('query_id')}")
            else:
                print(f"Failed to save query to search history: {save_result.get('message', 'Unknown error')}")
        else:
            print("User not authenticated, skipping query save to search history")
        
        # Extract keywords from the query
        keywords_with_source = extract_keywords(chat_input.message)
        
        # Calculate keyword relevance to original query
        query_words = set(word.lower().strip('.,?!:;()[]{}""\'') for word in chat_input.message.split() if len(word) > 3)
        keyword_overlap = [k for k in keywords_with_source if any(query_word in k["keyword"].lower() or k["keyword"].lower() in query_word for query_word in query_words)]
        
        # Log keyword relevance
        print(f"\nKeyword relevance analysis:")
        print(f"Main words in query: {', '.join(query_words)}")
        print(f"Keywords matching query: {', '.join(k['keyword'] for k in keyword_overlap)}")
        print(f"Match percentage: {len(keyword_overlap)/len(keywords_with_source)*100:.1f}% of keywords match query terms")
        
        # Search for articles using the keywords
        search_results = search_articles(keywords_with_source)
        
        # Find generated neutral article if it exists
        neutral_article = next((article for article in search_results 
                               if article.get('id') == 'neutral-generated'), None)
        
        # Other articles (excluding the neutral article)
        regular_articles = [article for article in search_results 
                           if article.get('id') != 'neutral-generated']
        
        # Sort articles to prioritize those matching original keywords
        regular_articles.sort(key=lambda x: 0 if x.get('keyword_source') == 'original' else 1)
        
        # Prepare response
        response = {
            "status": "success",
            "query": chat_input.message,
            "keywords": [k["keyword"] for k in keywords_with_source],
            "keywords_with_source": keywords_with_source,
            "keyword_analysis": {
                "query_main_words": list(query_words),
                "matching_keywords": [k["keyword"] for k in keyword_overlap],
                "matching_keywords_with_source": keyword_overlap,
                "match_percentage": round(len(keyword_overlap)/max(1, len(keywords_with_source))*100, 1)
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
        print(f"Keywords:")
        for k in keywords_with_source:
            source = "ORIGINAL" if k["from_original"] else "GENERATED"
            print(f"  {k['keyword']} [{source}]")
        print(f"Keyword match: {response['keyword_analysis']['match_percentage']}% overlap with query")
        print(f"Articles from original keywords: {sum(1 for a in regular_articles if a.get('keyword_source') == 'original')}")
        print(f"Articles from generated keywords: {sum(1 for a in regular_articles if a.get('keyword_source') == 'generated')}")
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
            "keywords": [],
            "keywords_with_source": [],
            "keyword_analysis": {
                "query_main_words": [],
                "matching_keywords": [],
                "matching_keywords_with_source": [],
                "match_percentage": 0
            },
            "results": [],
            "neutral_article": None
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

def generate_article_summary(article_content, article_title):
    """Generate a brief 3-point summary of an article using Cohere API"""
    try:
        print(f"Generating summary for article: {article_title[:50]}...")
        
        # Create prompt for summary generation
        prompt = f"""Summarize the following article in exactly 3 bullet points (using • as the bullet symbol).
        Each bullet point should be concise (max 15 words) and highlight a key fact or point from the article.
        
        Title: {article_title}
        
        Content: {article_content[:2000]}  # Limit content to avoid token limits
        
        Format your response as ONLY 3 bullet points, one per line, no introduction or conclusion:
        • First key point
        • Second key point
        • Third key point
        """
        
        response = cohere_client.generate(
            model='command',
            prompt=prompt,
            max_tokens=150,
            temperature=0.4,
            stop_sequences=["\n\n"]
        )
        
        summary_text = response.generations[0].text.strip()
        
        # Extract just the bullet points
        bullets = [line.strip() for line in summary_text.split('\n') if line.strip().startswith('•')]
        
        # Ensure we have exactly 3 bullet points
        if len(bullets) > 3:
            bullets = bullets[:3]
        elif len(bullets) < 3:
            # Add generic bullets if we don't have enough
            while len(bullets) < 3:
                bullets.append(f"• Additional information about {article_title.split()[:3]}")
        
        return bullets
        
    except Exception as e:
        print(f"Error generating article summary: {str(e)}")
        return [
            f"• Summary of article: {article_title[:30]}...",
            "• Could not generate complete summary",
            "• See full article for details"
        ]

# Authentication and User Management Routes

@app.post("/api/auth/register")
async def register(user_data: UserCreate, response: Response):
    result = auth_manager.register_user(user_data)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    # Create JWT token
    user_id = result["user"]["id"]
    access_token = create_access_token(user_id)
    print(f"User registered successfully: {result['user']['name']} (ID: {user_id})")
    print(f"Setting access_token cookie for user {user_id}")
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 1 week
    )
    
    return {"user": result["user"]}

@app.post("/api/auth/login")
async def login(credentials: UserLogin, response: Response):
    result = auth_manager.login_user(credentials)
    
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    
    # Create JWT token
    user_id = result["user"]["id"]
    access_token = create_access_token(user_id)
    print(f"User logged in successfully: {result['user']['name']} (ID: {user_id})")
    print(f"Setting access_token cookie for user {user_id}")
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 1 week
    )
    
    return {"user": result["user"]}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"success": True}

@app.get("/api/auth/me")
async def get_current_user_info(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"user": user}

@app.post("/api/auth/change-password")
async def change_password(
    password_data: PasswordUpdateRequest,
    user = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = auth_manager.update_password(
        user["id"],
        password_data.current_password,
        password_data.new_password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return {"message": "Password updated successfully"}

@app.delete("/api/auth/delete-account")
async def delete_account(response: Response, user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = auth_manager.delete_user(user["id"])
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    # Clear authentication
    response.delete_cookie(key="access_token")
    
    return {"message": "Account deleted successfully"}

@app.get("/api/user/queries")
async def get_user_queries(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = auth_manager.get_user_queries(user["id"])
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return {"queries": result["queries"]}

# Helper function to create a JWT token
def create_access_token(user_id: int):
    expires = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    
    payload = {
        "sub": str(user_id),
        "exp": expires
    }
    
    access_token = pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f"Created JWT token for user {user_id}, expires: {expires}")
    return access_token

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)