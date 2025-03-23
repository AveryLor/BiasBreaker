import cohere
import json
import logging
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os
from api.database import Database

# Configure logging
# logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class NeutralityCheck:
    def __init__(self):
        """
        Initialize the Neutrality Check module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        self.db = Database()

    def fetch_article_for_check(self, article_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch an article for neutrality checking.
        
        Args:
            article_id (Optional[str]): ID of the article to fetch
            
        Returns:
            Dict[str, Any]: Article data for neutrality check
        """
        # First try to fetch the specified article
        if article_id:
            article = self.db.fetch_article_by_id(article_id)
            if article:
                return {
                    "customized_article": {
                        "title": article.get('title', ''),
                        "content": article.get('content', article.get('body', ''))
                    }
                }
        
        # Otherwise try to fetch the most recent article
        articles = self.db.fetch_articles(limit=1)
        if articles and len(articles) > 0:
            return {
                "customized_article": {
                    "title": articles[0].get('title', ''),
                    "content": articles[0].get('content', articles[0].get('body', ''))
                }
            }
        
        # Return a default structure if no articles found
        return {
            "customized_article": {
                "title": "No article available",
                "content": "No content available"
            }
        }

    def evaluate_neutrality(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the neutrality/bias of an article.
        
        Args:
            article_data (Dict[str, Any]): Article data with 'customized_article' key containing article to check
            
        Returns:
            Dict[str, Any]: Neutrality evaluation results with bias score and segments
        """
        # If article data is empty, fetch an article
        if not article_data or 'customized_article' not in article_data:
            article_data = self.fetch_article_for_check()
            
        # Extract the article
        article = article_data.get('customized_article', {})
        title = article.get('title', '')
        content = article.get('content', '')
        
        # Modified prompt to emphasize the range
        prompt = f"""
        Analyze the political bias of the following article. Provide a score from 0 to 100 based on the political leaning of the content:

        0 = Extreme left-wing (very liberal, progressive, or socialist-leaning views)
        50 = Neutral or factual (balanced coverage, no clear political leaning)
        100 = Extreme right-wing (very conservative, nationalist, or traditionalist views)
        Values in between are also encouraged.

        Focus on language, framing, and ideological slant to determine the political bias.
        Also, make sure to provide a precise, unique score. Avoid using common round numbers.

        Title: {title}
        Content: {content}

        Reply with ONLY this line:

        BIAS_SCORE: [number between 0-100]
        BIASED_SEGMENTS: [list of short biased phrases or sentences]
        """

        try:
            response = self.client.chat(
                message=prompt,
                model="command",
                temperature=0.7,  # Increased temperature for more variance
                max_tokens=100
            )
            
            # Print raw response for debugging
            print(f"\nRaw Cohere response: {response.text}")
            
            # Extract evaluation components
            generated_text = response.text.strip()
            bias_score = 50  # Default neutral
            biased_segments = []
            
            # More robust parsing
            for line in generated_text.split('\n'):
                line = line.strip()
                if line.startswith('BIAS_SCORE:'):
                    score_text = line.replace('BIAS_SCORE:', '').strip()
                    try:
                        # Extract first number found in the text
                        numbers = re.findall(r'\d+', score_text)
                        if numbers:
                            bias_score = min(100, max(0, int(numbers[0])))
                            print(f"Extracted bias score: {bias_score}")
                    except ValueError as e:
                        print(f"Error parsing bias score: {e}")
                        
                elif line.startswith('BIASED_SEGMENTS:'):
                    segment = line.replace('BIASED_SEGMENTS:', '').strip()
                    if segment and segment != "[]":
                        biased_segments = [segment]
            
            result = {
                "bias_score": bias_score,
                "biased_segments": biased_segments,
                "recommendations": []  # Simplified for faster processing
            }
            
            # Save the neutrality check result to the database
            self.db.save_analysis_result(title, result, "neutrality_check")
            
            return result
            
        except Exception as e:
            print(f"Error in neutrality evaluation: {str(e)}")
            return {
                "bias_score": 50,
                "biased_segments": [],
                "recommendations": []
            }

    def format_output(self, neutrality_result: Dict[str, Any]) -> str:
        """
        Format the neutrality evaluation result as a JSON string.
        
        Args:
            neutrality_result (Dict[str, Any]): The neutrality evaluation result to format
            
        Returns:
            str: JSON string representation of the neutrality evaluation result
        """
        return json.dumps(neutrality_result, indent=2) 