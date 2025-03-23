import os
import sys
import httpx
import asyncio
import json

async def test_endpoints():
    """Test the FastAPI endpoints that connect to Supabase"""
    base_url = "http://127.0.0.1:8000"
    
    print("Starting API endpoint tests...")
    print("Make sure your FastAPI server is running first!")
    print(f"Server expected at: {base_url}")
    print("-------------------------------------")
    
    async with httpx.AsyncClient() as client:
        # Test 1: Root endpoint
        print("\nTest 1: Testing root endpoint...")
        try:
            response = await client.get(f"{base_url}/")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.json()}")
            print("Root endpoint test successful" if response.status_code == 200 else "Root endpoint test failed")
        except Exception as e:
            print(f"Error testing root endpoint: {str(e)}")
        
        # Test 2: Get all news articles
        print("\nTest 2: Testing /news endpoint (Supabase connection)...")
        try:
            response = await client.get(f"{base_url}/news")
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                article_count = len(data)
                print(f"Retrieved {article_count} articles from Supabase")
                if article_count > 0:
                    print(f"First article: {json.dumps(data[0], indent=2)}")
                print("News endpoint test successful")
            else:
                print(f"News endpoint test failed: {response.text}")
        except Exception as e:
            print(f"Error testing news endpoint: {str(e)}")
        
        # Test 3: Get a specific news article
        print("\nTest 3: Testing /news/{id} endpoint...")
        try:
            # First get all news to find a valid ID
            response = await client.get(f"{base_url}/news")
            if response.status_code == 200 and len(response.json()) > 0:
                article_id = response.json()[0]["id"]
                print(f"Testing with article ID: {article_id}")
                
                response = await client.get(f"{base_url}/news/{article_id}")
                print(f"Status code: {response.status_code}")
                if response.status_code == 200:
                    print(f"Retrieved article: {json.dumps(response.json(), indent=2)}")
                    print("Specific news endpoint test successful")
                else:
                    print(f"Specific news endpoint test failed: {response.text}")
            else:
                print("Skipping specific news test: No articles available")
        except Exception as e:
            print(f"Error testing specific news endpoint: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_endpoints()) 