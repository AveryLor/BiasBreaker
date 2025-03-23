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

class UserCustomization:
    def __init__(self):
        """
        Initialize the User Customization module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        self.db = Database()

    def fetch_user_settings(self, user_id: str) -> Dict[str, Any]:
        """
        Fetch user's customization settings from the database.
        
        Args:
            user_id (str): ID of the user
            
        Returns:
            Dict[str, Any]: User's customization settings
        """
        return self.db.fetch_user_settings(user_id)

    def fetch_enhanced_article(self, article_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch an article that has been enhanced with DEI focus.
        
        Args:
            article_id (Optional[str]): ID of the article to fetch
            
        Returns:
            Dict[str, Any]: Enhanced article with DEI section
        """
        # Try to fetch a DEI-focused article from the database
        try:
            prev_analyses = self.db.fetch_previous_analyses("dei_focus", 5)
            
            # If article_id is provided, try to match it with the article ID in the database
            if article_id and prev_analyses:
                for analysis in prev_analyses:
                    # The query field typically contains the article title, not the ID
                    # We'd need to fetch the article by ID and then match by title
                    article = self.db.fetch_article_by_id(article_id)
                    if article and article.get('title', '').lower() == analysis['query'].lower():
                        dei_result = json.loads(analysis['result'])
                        logger.info(f"Found matching DEI analysis for article ID: {article_id}")
                        return dei_result
            
            # If no specific article found or no ID provided, use the most recent DEI analysis
            if prev_analyses:
                dei_result = json.loads(prev_analyses[0]['result'])
                logger.info("Using most recent DEI analysis")
                return dei_result
        except Exception as e:
            logger.error(f"Error fetching DEI analysis from database: {str(e)}")
        
        # If no DEI analysis found in the database, fetch a regular article
        try:
            article = None
            if article_id:
                article = self.db.fetch_article_by_id(article_id)
            
            if not article:
                # Fetch the most recent article
                articles = self.db.fetch_articles(limit=1)
                if articles and len(articles) > 0:
                    article = articles[0]
            
            if article:
                # Create a basic structure with the article content
                return {
                    "updated_article": {
                        "title": article.get('title', ''),
                        "content": article.get('content', article.get('body', ''))
                    },
                    "dei_section": "This article has not yet been analyzed for DEI perspectives."
                }
        except Exception as e:
            logger.error(f"Error fetching article from database: {str(e)}")
        
        # Return empty structure if no articles found
        return {
            "updated_article": {
                "title": "No enhanced article available",
                "content": "No content available"
            },
            "dei_section": "No DEI analysis available"
        }

    def customize_dei_emphasis(self, article_data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Customize the DEI emphasis based on user preferences.
        
        Args:
            article_data (Dict[str, Any]): Article data with DEI emphasis
            settings (Dict[str, Any]): User's customization settings
            
        Returns:
            Dict[str, Any]: Customized article with adjusted DEI emphasis
        """
        # If article data is empty, fetch an enhanced article
        if not article_data or 'updated_article' not in article_data:
            article_data = self.fetch_enhanced_article()
            
        # Extract settings with defaults
        emphasis_level = settings.get('emphasis_level', 5)
        focus_groups = settings.get('focus_groups', [])
        if isinstance(focus_groups, str):
            try:
                focus_groups = json.loads(focus_groups)
            except json.JSONDecodeError:
                focus_groups = []
        tone = settings.get('tone', 'balanced')
        
        # Prepare the prompt
        prompt = f"""
        Customize this article based on user preferences:
        
        ORIGINAL ARTICLE:
        Title: {article_data['updated_article']['title']}
        Content: {article_data['updated_article']['content']}
        
        DEI SECTION:
        {article_data.get('dei_section', '')}
        
        USER PREFERENCES:
        Emphasis Level (1-10): {emphasis_level}
        Focus Groups: {', '.join(focus_groups) if focus_groups else 'None specified'}
        Tone: {tone}
        
        Please customize the article to:
        1. Adjust DEI emphasis to match the specified level ({emphasis_level}/10)
        2. Give special attention to the specified focus groups (if any)
        3. Maintain the requested tone ({tone})
        
        Format your response as:
        CUSTOMIZED_TITLE: [customized title]
        
        CUSTOMIZED_CONTENT: [customized content]
        
        CUSTOMIZED_DEI_SECTION: [customized DEI section]
        """

        # Generate the customized content
        try:
            response = self.client.chat(
                message=prompt,
                model="command",
                temperature=0.4
            )
            
            # Extract the text from the chat response
            generated_text = response.text
            
            # Extract sections
            sections = generated_text.split('\n\n')
            customized_title = ""
            customized_content = ""
            customized_dei_section = ""
            
            for section in sections:
                if section.startswith('CUSTOMIZED_TITLE:'):
                    customized_title = section.replace('CUSTOMIZED_TITLE:', '').strip()
                elif section.startswith('CUSTOMIZED_CONTENT:'):
                    customized_content = section.replace('CUSTOMIZED_CONTENT:', '').strip()
                elif section.startswith('CUSTOMIZED_DEI_SECTION:'):
                    customized_dei_section = section.replace('CUSTOMIZED_DEI_SECTION:', '').strip()
            
            result = {
                "customized_article": {
                    "title": customized_title,
                    "content": customized_content
                },
                "customized_dei_section": customized_dei_section
            }
            
            # Save the customization result with the user ID as part of the query
            query = f"user:{settings.get('user_id', 'anonymous')}:{article_data['updated_article']['title']}"
            self.db.save_analysis_result(query, result, "user_customization")
        
        except Exception as e:
            logger.error(f"Error calling Cohere API: {str(e)}")
            
            # Try to fetch a previous customization for the same user
            try:
                # Search for previous customizations by this user
                user_id = settings.get('user_id', 'anonymous')
                prev_analyses = self.db.fetch_previous_analyses("user_customization", 10)
                
                # Look for a customization with the same user ID
                user_customization = None
                for analysis in prev_analyses:
                    if analysis['query'].startswith(f"user:{user_id}:"):
                        user_customization = analysis
                        break
                
                if user_customization:
                    # If found, use the previous customization
                    prev_result = json.loads(user_customization['result'])
                    logger.info(f"Using previous customization for user: {user_id}")
                    return prev_result
                else:
                    # If not found, create a minimal customization
                    result = {
                        "customized_article": {
                            "title": article_data['updated_article']['title'],
                            "content": article_data['updated_article']['content']
                        },
                        "customized_dei_section": article_data.get('dei_section', '') + f"\n\nNote: This section has been adjusted to a {emphasis_level}/10 emphasis level with a {tone} tone."
                    }
                    return result
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                # Create a minimal customization if database access fails
                result = {
                    "customized_article": {
                        "title": article_data['updated_article']['title'],
                        "content": article_data['updated_article']['content']
                    },
                    "customized_dei_section": article_data.get('dei_section', '') + "\n\nNote: Customization could not be applied."
                }
                return result
        
        return result

    def format_output(self, customization_result: Dict[str, Any]) -> str:
        """
        Format the customization result as a JSON string.
        
        Args:
            customization_result (Dict[str, Any]): The customization result to format
            
        Returns:
            str: JSON string representation of the customization result
        """
        return json.dumps(customization_result, indent=2) 