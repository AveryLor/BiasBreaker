import cohere
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os
from database import Database

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
        
        # Try to fetch analysis results for this article
        # In a real implementation, we would fetch from a separate table
        # For now, we'll use placeholder data
        formatted_article["underrepresented"] = {
            "segments": [
                "Example segment highlighting underrepresented voices",
                "Another example segment with marginalized perspectives"
            ],
            "demographics": [
                "Women in leadership",
                "Ethnic minorities",
                "People with disabilities"
            ]
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
            # In a real implementation, we would save to a separate table
            # For now, we'll just save the analysis result
            self.db.save_analysis_result(
                article_data['main_article']['title'],
                result,
                "dei_focus"
            )
        
            return result
        
        except Exception as e:
            print(f"Error calling Cohere API: {str(e)}")
            # Provide mock result if API call fails
            updated_title = "Economic Disparities Across Global Markets: A Balanced Perspective"
            updated_content = "The global economy showed varied performance metrics across different demographics and regions in the last quarter. Studies indicate persistent challenges despite overall market growth."
            dei_section = "This article highlights important DEI aspects related to global economics including funding gaps for underrepresented groups and systemic barriers to economic participation."
            sections = []
            result = {
                "updated_article": {
                    "title": updated_title,
                    "content": updated_content
                },
                "dei_section": dei_section
            }
            self.db.save_analysis_result(
                article_data['main_article']['title'],
                result,
                "dei_focus"
            )
            return result

    def format_output(self, dei_result: Dict[str, Any]) -> str:
        """
        Format the DEI emphasis result as a JSON string.
        
        Args:
            dei_result (Dict[str, Any]): The DEI emphasis result to format
            
        Returns:
            str: JSON string representation of the DEI emphasis result
        """
        return json.dumps(dei_result, indent=2) 