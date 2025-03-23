import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import cohere  # Add this import

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
        all_results = []
        print(f"Searching for articles with keywords: {keywords}")
        
        # Search for each keyword
        for keyword in keywords:
            print(f"Searching for keyword: {keyword}")
            response = supabase.table("news") \
                .select("id, article_titles") \
                .ilike("article_titles", f"%{keyword}%") \
                .execute()
            
            print(f"Found {len(response.data)} results for keyword '{keyword}'")
            
            if response.data:
                for article in response.data:
                    # Avoid duplicates
                    if not any(r['id'] == article['id'] for r in all_results):
                        print(f"Adding article: {article['article_titles']}")
                        all_results.append({
                            "id": article['id'],
                            "title": article['article_titles']
                        })
            else:
                print(f"No results found for keyword '{keyword}'")
                
        print(f"Total unique articles found: {len(all_results)}")
        return all_results
            
    except Exception as e:
        print(f"Error searching articles: {str(e)}")
        return []

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