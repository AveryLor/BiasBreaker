import os
import uvicorn
from api.neutrality_check import NeutralityCheck
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import cohere  # Add this import
import logging

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
cohere_api_key = os.getenv("COHERE_API_KEY")  # Add this line

supabase = create_client(supabase_url, supabase_key)
co = cohere.Client(cohere_api_key)  # Add this line

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
        response = co.generate(
            model='command',
            prompt=f"Extract 5 key search terms related to this topic: {message}\nOutput only the words separated by commas:",
            max_tokens=50,
            temperature=0.3,
            stop_sequences=["\n"]
        )
        
        keywords = [word.strip() for word in response.generations[0].text.split(',')]
        print("\nKeywords extracted:", keywords)  # Added newline for clarity
        return keywords
    except Exception as e:
        print("\nError in keyword extraction:", str(e))
        return [message]

def search_articles(keywords):
    try:
        all_results = []
        neutrality_checker = NeutralityCheck()
        bias_scores_dict = {}  # Dictionary to store ID: bias_score pairs
        
        print("\nSearching for articles...")
        
        for keyword in keywords:
            response = supabase.table("news") \
                .select("id, article_titles, news_information") \
                .ilike("article_titles", f"%{keyword}%") \
                .execute()
            
            if response.data:
                for article in response.data:
                    if not any(r['id'] == article['id'] for r in all_results):
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
        selected_articles = find_closest_articles(bias_scores_dict.copy())
        
        print("\nSelected articles for diverse bias representation:")
        for article_id, score in selected_articles.items():
            article = next((a for a in all_results if a['id'] == article_id), None)
            if article:
                print(f"\nTitle: {article['title']}")
                print(f"Bias Score: {score}")
                if article['biased_segments']:
                    print("Biased Segments:", ", ".join(article['biased_segments']))
        
        return all_results
            
    except Exception as e:
        print("\nError in article search:", str(e))
        return []

@app.post("/api/chat")
def receive_chat(chat_input: ChatInput):
    try:
        keywords = extract_keywords(chat_input.message)
        search_results = search_articles(keywords)
        
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
        print(f"Error in chat endpoint: {str(e)}")
        return {
            "status": "error",
            "message": "An error occurred",
            "results": []
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)