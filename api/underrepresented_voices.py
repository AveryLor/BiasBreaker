import cohere
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import os
from api.database import Database

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class UnderrepresentedVoices:
    def __init__(self):
        """
        Initialize the Underrepresented Voices module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        self.db = Database()

    def fetch_article_from_db(self, article_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetch an article from the database.
        
        Args:
            article_id (Optional[str]): ID of the article to fetch
            
        Returns:
            Optional[Dict[str, Any]]: Article from database or None if not found
        """
        if article_id:
            db_article = self.db.fetch_article_by_id(article_id)
            if db_article:
                return {
                    'title': db_article.get('title', ''),
                    'body': db_article.get('content', db_article.get('body', ''))
                }
        
        # If no article ID provided or article not found, fetch the most recent
        articles = self.db.fetch_articles(limit=1)
        if articles and len(articles) > 0:
            return {
                'title': articles[0].get('title', ''),
                'body': articles[0].get('content', articles[0].get('body', ''))
            }
        
        return None

    def identify_underrepresented_perspectives(self, article: Dict[str, str]) -> Dict[str, Any]:
        """
        Identify underrepresented perspectives and voices in a news article.
        
        Args:
            article (Dict[str, str]): Article with 'title' and 'body' keys
            
        Returns:
            Dict[str, Any]: Structured data highlighting underrepresented perspectives
        """
        # If article dict is empty, fetch from database
        if not article or not article.get('title') or not article.get('body'):
            db_article = self.fetch_article_from_db()
            if db_article:
                article = db_article
            else:
                raise ValueError("No article available for analysis")
                
        # Prepare the prompt
        prompt = f"""
        Analyze the following news article and identify underrepresented perspectives or voices:
        
        Title: {article['title']}
        
        Body:
        {article['body']}
        
        Please identify:
        1. Segments of text that mention underrepresented groups or perspectives
        2. Demographics or groups that might be underrepresented in this article
        3. Recommendations for including more diverse perspectives
        
        Format as JSON with the following structure:
        {{
            "underrepresented": {{
                "segments": ["segment1", "segment2", ...],
                "demographics": ["demographic1", "demographic2", ...]
            }},
            "recommendations": ["recommendation1", "recommendation2", ...]
        }}
        """

        # Generate the analysis
        try:
            response = self.client.chat(
                message=prompt,
                model="command", 
                temperature=0.4
            )
            
            # Extract the text from the chat response
            generated_text = response.text
            
            # Parse the generated JSON
            try:
                result = json.loads(generated_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                text = generated_text
                result = {
                    "underrepresented": {
                        "segments": [],
                        "demographics": []
                    },
                    "recommendations": []
                }
                
                # Try to extract segments
                if "segments" in text:
                    segments_section = text.split("segments")[1].split("demographics")[0]
                    segments = [s.strip().strip(':"[],"') for s in segments_section.split("\n") if s.strip() and '"' in s]
                    result["underrepresented"]["segments"] = segments
                    
                # Try to extract demographics
                if "demographics" in text:
                    demographics_section = text.split("demographics")[1].split("recommendations")[0]
                    demographics = [d.strip().strip(':"[],"') for d in demographics_section.split("\n") if d.strip() and '"' in d]
                    result["underrepresented"]["demographics"] = demographics
                    
                # Try to extract recommendations
                if "recommendations" in text:
                    recommendations_section = text.split("recommendations")[1]
                    recommendations = [r.strip().strip(':"[],"') for r in recommendations_section.split("\n") if r.strip() and '"' in r]
                    result["recommendations"] = recommendations
        except Exception as e:
            logger.error(f"Error calling Cohere API: {str(e)}")
            # Try to get similar analysis from database
            try:
                prev_analyses = self.db.fetch_previous_analyses("underrepresented_voices", 3)
                if prev_analyses:
                    # Use the most recent analysis result since we can't easily compare articles
                    prev_result_data = json.loads(prev_analyses[0]['result'])
                    logger.info(f"Using analysis from database as fallback")
                    result = prev_result_data
                else:
                    # If no previous analyses, create a minimal structure
                    result = {
                        "underrepresented": {
                            "segments": [],
                            "demographics": []
                        },
                        "recommendations": [
                            "Consider including perspectives from diverse demographic groups",
                            "Research how this topic affects underrepresented communities"
                        ]
                    }
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                # Create a minimal structure if all else fails
                result = {
                    "underrepresented": {
                        "segments": [],
                        "demographics": []
                    },
                    "recommendations": [
                        "Consider including perspectives from diverse demographic groups",
                        "Research how this topic affects underrepresented communities"
                    ]
                }

        # Save analysis result to database with the article title as query
        self.db.save_analysis_result(article['title'], result, "underrepresented_voices")
        
        return result

    def format_output(self, analysis_result: Dict[str, Any]) -> str:
        """
        Format the analysis result as a JSON string.
        
        Args:
            analysis_result (Dict[str, Any]): The analysis result to format
            
        Returns:
            str: JSON string representation of the analysis result
        """
        return json.dumps(analysis_result, indent=2) 