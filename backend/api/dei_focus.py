import cohere
import json
import logging
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
import os
from api.database import Database

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class DEIFocus:
    def __init__(self):
        """
        Initialize the DEI Focus module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        self.db = Database()

    def fetch_article_with_analysis(self, article_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch an article along with its underrepresented voices analysis.
        
        Args:
            article_id (Optional[str]): ID of the article to fetch
            
        Returns:
            Dict[str, Any]: Article with underrepresented voices analysis
        """
        # First try to fetch the specified article or most recent one
        article = None
        if article_id:
            article = self.db.fetch_article_by_id(article_id)
        
        if not article:
            articles = self.db.fetch_articles(limit=1)
            if articles and len(articles) > 0:
                article = articles[0]
        
        if not article:
            # If no articles in database, return a minimal structure
            return {
                "main_article": {
                    "title": "No article available",
                    "body": "No content available"
                },
                "underrepresented": {
                    "segments": [],
                    "demographics": []
                }
            }
        
        # Format article data
        formatted_article = {
            "main_article": {
                "title": article.get('title', ''),
                "body": article.get('content', article.get('body', ''))
            }
        }
        
        # Try to fetch analysis results for this article from the database
        try:
            # Try to find an underrepresented_voices analysis for this article
            prev_analyses = self.db.fetch_previous_analyses("underrepresented_voices", 10)
            
            # Look for analysis with a matching title
            underrepresented_data = None
            article_title = formatted_article["main_article"]["title"]
            
            for analysis in prev_analyses:
                if analysis["query"].lower() == article_title.lower():
                    # Found a matching analysis
                    underrepresented_data = json.loads(analysis["result"])
                    logger.info(f"Found matching underrepresented voices analysis")
                    break
            
            # If no exact match, check for similar titles
            if not underrepresented_data and prev_analyses:
                import difflib
                similarities = [(difflib.SequenceMatcher(None, article_title.lower(), a["query"].lower()).ratio(), a) for a in prev_analyses]
                best_match = max(similarities, key=lambda x: x[0])
                if best_match[0] > 0.6:  # If similarity is greater than 60%
                    underrepresented_data = json.loads(best_match[1]["result"])
                    logger.info(f"Using underrepresented voices analysis from similar article (similarity: {best_match[0]:.2f})")
                else:
                    # Use the most recent analysis as a fallback
                    underrepresented_data = json.loads(prev_analyses[0]["result"])
                    logger.info(f"Using most recent underrepresented voices analysis as fallback")
            
            # If we found analysis data, add it to the formatted article
            if underrepresented_data:
                if "underrepresented" in underrepresented_data:
                    formatted_article["underrepresented"] = underrepresented_data["underrepresented"]
                else:
                    # Fall back to basic structure if the format doesn't match expectations
                    formatted_article["underrepresented"] = {
                        "segments": [],
                        "demographics": []
                    }
                    if isinstance(underrepresented_data, dict):
                        for key, value in underrepresented_data.items():
                            if isinstance(value, list) and key in ["segments", "demographics"]:
                                formatted_article["underrepresented"][key] = value
            else:
                # If no analysis found, add empty structure
                formatted_article["underrepresented"] = {
                    "segments": [],
                    "demographics": []
                }
        except Exception as e:
            logger.error(f"Error fetching underrepresented analysis from database: {str(e)}")
            # Add empty structure if there was an error
            formatted_article["underrepresented"] = {
                "segments": [],
                "demographics": []
            }
        
        return formatted_article

    def emphasize_dei(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Emphasize diversity, equity, and inclusion aspects in the article.
        
        Args:
            article_data (Dict[str, Any]): Article data with main article and underrepresented voices analysis
            
        Returns:
            Dict[str, Any]: Enhanced article with DEI focus
        """
        # If article data is incomplete, try to fetch from database
        if not article_data or 'main_article' not in article_data or 'underrepresented' not in article_data:
            article_data = self.fetch_article_with_analysis()
            
        # Prepare the prompt
        prompt = f"""
        Enhance the following article to emphasize diversity, equity, and inclusion perspectives:
        
        ORIGINAL ARTICLE:
        Title: {article_data['main_article']['title']}
        Content: {article_data['main_article']['body']}
        
        UNDERREPRESENTED PERSPECTIVES:
        Segments: {json.dumps(article_data['underrepresented']['segments'])}
        Demographics: {json.dumps(article_data['underrepresented']['demographics'])}
        
        Please revise the article to:
        1. Amplify the underrepresented voices and perspectives
        2. Ensure balanced representation of diverse viewpoints
        3. Include a dedicated DEI section that highlights these issues
        4. Maintain factual accuracy and journalistic integrity
        
        Format your response as:
        UPDATED_TITLE: [revised title]
        
        UPDATED_CONTENT: [revised content]
        
        DEI_SECTION: [dedicated section highlighting DEI aspects]
        """

        # Generate the enhanced content
        try:
            response = self.client.chat(
                message=prompt,
                model="command",
                temperature=0.5
            )
            
            # Extract the text from the chat response
            generated_text = response.text
            
            # Extract sections
            sections = generated_text.split('\n\n')
            updated_title = ""
            updated_content = ""
            dei_section = ""
        
            for section in sections:
                if section.startswith('UPDATED_TITLE:'):
                    updated_title = section.replace('UPDATED_TITLE:', '').strip()
                elif section.startswith('UPDATED_CONTENT:'):
                    updated_content = section.replace('UPDATED_CONTENT:', '').strip()
                elif section.startswith('DEI_SECTION:'):
                    dei_section = section.replace('DEI_SECTION:', '').strip()
        
            result = {
                "updated_article": {
                    "title": updated_title,
                    "content": updated_content
                },
                "dei_section": dei_section
            }
        
            # Save the enhanced article to the database
            self.db.save_analysis_result(
                article_data['main_article']['title'],
                result,
                "dei_focus"
            )
        
            return result
        
        except Exception as e:
            logger.error(f"Error calling Cohere API: {str(e)}")
            
            # Try to get a similar DEI focus analysis from the database
            try:
                prev_analyses = self.db.fetch_previous_analyses("dei_focus", 5)
                if prev_analyses:
                    # Look for a similar article title
                    article_title = article_data['main_article']['title']
                    
                    # Check for exact match first
                    exact_match = None
                    for analysis in prev_analyses:
                        if analysis["query"].lower() == article_title.lower():
                            exact_match = analysis
                            break
                    
                    if exact_match:
                        prev_result = json.loads(exact_match["result"])
                        logger.info(f"Using DEI focus analysis from matching article")
                        return prev_result
                    
                    # Look for similar title
                    import difflib
                    similarities = [(difflib.SequenceMatcher(None, article_title.lower(), a["query"].lower()).ratio(), a) for a in prev_analyses]
                    best_match = max(similarities, key=lambda x: x[0])
                    
                    if best_match[0] > 0.5:  # If similarity is greater than 50%
                        prev_result = json.loads(best_match[1]["result"])
                        logger.info(f"Using DEI focus analysis from similar article (similarity: {best_match[0]:.2f})")
                        return prev_result
                    
                    # Use most recent as fallback
                    prev_result = json.loads(prev_analyses[0]["result"])
                    logger.info(f"Using most recent DEI focus analysis as fallback")
                    return prev_result
                
                # If no previous analyses, create a minimal result
                return {
                    "updated_article": {
                        "title": article_data['main_article']['title'],
                        "content": article_data['main_article']['body']
                    },
                    "dei_section": "The article could benefit from including perspectives from diverse communities and considering impacts across different demographic groups."
                }
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                
                # Create a minimal result if database access fails
                return {
                    "updated_article": {
                        "title": article_data['main_article']['title'],
                        "content": article_data['main_article']['body']
                    },
                    "dei_section": "The article could benefit from including perspectives from diverse communities and considering impacts across different demographic groups."
                }

    def format_output(self, dei_result: Dict[str, Any]) -> str:
        """
        Format the DEI emphasis result as a JSON string.
        
        Args:
            dei_result (Dict[str, Any]): The DEI emphasis result to format
            
        Returns:
            str: JSON string representation of the DEI emphasis result
        """
        return json.dumps(dei_result, indent=2) 