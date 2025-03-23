import os
import uvicorn
from api.neutrality_check import NeutralityCheck
from api.neutral_article_generator import NeutralArticleGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import cohere
import logging
import json
import random
from typing import List, Dict, Any, Optional

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

# Import custom API modules
from api.neutrality_check import NeutralityCheck
from api.neutral_article_generator import NeutralArticleGenerator
from api.natural_language_understanding import NaturalLanguageUnderstanding

# Initialize API clients
nlu = NaturalLanguageUnderstanding()  # Don't pass cohere_client
neutral_generator = NeutralArticleGenerator()  # Initialize the neutral article generator

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
                
            response = supabase.table("news") \
                .select("id, article_titles, news_information") \
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
        if selected_articles and len(selected_articles) >= 4:
            # Prepare source articles info
            source_articles = []
            min_bias = min(article.get('bias_score', 0) for article in selected_articles)
            max_bias = max(article.get('bias_score', 0) for article in selected_articles)
            
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
                print("SUMMARY:")
                for bullet in summary:
                    print(f"  {bullet}")
                print(f"{'.'*50}")
                
                # Add this article with its summary to the source_articles list
                source_articles.append({
                    "id": article.get('id', 'unknown'),
                    "title": article.get('title', 'No title'),
                    "bias_score": article.get('bias_score', 0),
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)