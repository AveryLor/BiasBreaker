import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables and setup Supabase
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

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

def search_articles(keyword):
    try:
        response = supabase.table("news") \
            .select("id, article_titles") \
            .ilike("article_titles", f"%{keyword}%") \
            .execute()
        
        if response.data:
            results = []
            for article in response.data:
                results.append({
                    "id": article['id'],
                    "title": article['article_titles']
                })
            return results
        return []
            
    except Exception as e:
        print(f"Error searching articles: {str(e)}")
        return []

@app.post("/api/chat")
def receive_chat(chat_input: ChatInput):
    print(f"Received chat message: {chat_input.message}")
    # Search for articles using the chat message as keyword
    search_results = search_articles(chat_input.message)
    
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