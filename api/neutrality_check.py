import cohere
import json
import logging
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os
from api.database import Database

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        
        # Prepare the prompt
        prompt = f"""
        Evaluate the neutrality and political bias of the following article:
        
        Title: {title}
        Content: {content}
        
        Please provide:
        1. A bias score from 0 to 100 (0=far left, 50=neutral, 100=far right)
        2. Identified segments showing potential bias
        3. Recommendations for improving neutrality
        
        Format your evaluation as:
        BIAS_SCORE: [score]
        
        BIASED_SEGMENTS:
        [list of biased segments]
        
        RECOMMENDATIONS:
        [list of recommendations]
        """

        # Generate the neutrality evaluation
        try:
            response = self.client.chat(
                message=prompt,
                model="command",
                temperature=0.3
            )
            
            # Extract the text from the chat response
            generated_text = response.text
            
            # Extract evaluation components
            sections = generated_text.split('\n\n')
            bias_score = 50  # Default neutral
            biased_segments = []
            recommendations = []
            
            for section in sections:
                if section.startswith('BIAS_SCORE:'):
                    try:
                        bias_score = int(section.replace('BIAS_SCORE:', '').strip())
                    except ValueError:
                        # If parsing fails, extract just the number
                        numbers = re.findall(r'\d+', section)
                        if numbers:
                            bias_score = int(numbers[0])
                elif section.startswith('BIASED_SEGMENTS:'):
                    segment_text = section.replace('BIASED_SEGMENTS:', '').strip()
                    if segment_text:
                        biased_segments = [seg.strip() for seg in segment_text.split('\n') if seg.strip()]
                elif section.startswith('RECOMMENDATIONS:'):
                    rec_text = section.replace('RECOMMENDATIONS:', '').strip()
                    if rec_text:
                        recommendations = [rec.strip() for rec in rec_text.split('\n') if rec.strip()]
            
            result = {
                "bias_score": bias_score,
                "biased_segments": biased_segments,
                "recommendations": recommendations
            }
            
            # Save the neutrality check result to the database
            self.db.save_analysis_result(title, result, "neutrality_check")
        
        except Exception as e:
            logger.error(f"Error calling Cohere API: {str(e)}")
            
            # Try to fetch similar analyses from the database
            try:
                # Try to get previous analyses for similar articles
                prev_analyses = self.db.fetch_previous_analyses("neutrality_check", 5)
                
                # If we have previous analyses, use the most recent one
                if prev_analyses:
                    # Look for a similar title
                    most_similar_analysis = None
                    highest_similarity = 0
                    
                    import difflib
                    for analysis in prev_analyses:
                        similarity = difflib.SequenceMatcher(None, title.lower(), analysis['query'].lower()).ratio()
                        if similarity > highest_similarity:
                            highest_similarity = similarity
                            most_similar_analysis = analysis
                    
                    # If we found a similar analysis with at least 30% similarity
                    if most_similar_analysis and highest_similarity > 0.3:
                        prev_result = json.loads(most_similar_analysis['result'])
                        logger.info(f"Using similar previous analysis (similarity: {highest_similarity:.2f})")
                        result = prev_result
                    else:
                        # Use the most recent analysis as fallback
                        result = json.loads(prev_analyses[0]['result'])
                        logger.info("Using most recent analysis as fallback")
                else:
                    # Create a balanced default result if no previous analyses
                    result = {
                        "bias_score": 50,
                        "biased_segments": [],
                        "recommendations": [
                            "Include diverse perspectives on the topic",
                            "Use neutral language when describing different viewpoints",
                            "Present factual information with appropriate context"
                        ]
                    }
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                # Create a balanced default result if database access fails
                result = {
                    "bias_score": 50,
                    "biased_segments": [],
                    "recommendations": [
                        "Include diverse perspectives on the topic",
                        "Use neutral language when describing different viewpoints",
                        "Present factual information with appropriate context"
                    ]
                }
        
        return result

    def format_output(self, neutrality_result: Dict[str, Any]) -> str:
        """
        Format the neutrality evaluation result as a JSON string.
        
        Args:
            neutrality_result (Dict[str, Any]): The neutrality evaluation result to format
            
        Returns:
            str: JSON string representation of the neutrality evaluation result
        """
        return json.dumps(neutrality_result, indent=2) 