import cohere
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os
from database import Database

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
        # For now, return a sample structure
        # In a real implementation, we would fetch from the database
        return {
            "updated_article": {
                "title": "Economic Disparities Persist Across Global Markets",
                "content": """
                The global economy showed varied performance metrics across regions and demographics last quarter.
                While Western economies maintained growth, developing nations encountered significant challenges.
                Women-led businesses in Southeast Asia demonstrated strong performance despite funding difficulties.
                Indigenous communities continue to advocate for infrastructure development to enable economic participation.
                Experts have highlighted concerns about growing wealth inequality despite market gains.
                """
            },
            "dei_section": """
            This article highlights several key DEI issues in global economics:
            
            1. The funding gap faced by women-led businesses despite their strong performance
            2. Infrastructure challenges disproportionately affecting indigenous communities
            3. Systemic barriers to economic development in developing nations
            4. Wealth inequality undermining inclusive economic growth
            
            These perspectives are critical to understanding the full economic picture beyond traditional metrics.
            """
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
            print(f"Error calling Cohere API: {str(e)}")
            # Provide mock result if API call fails
            result = {
                "customized_article": {
                    "title": "Economic Disparities: A Balanced View with Focus on Underrepresented Communities",
                    "content": "The global economy showed varied performance across different demographics and regions last quarter. Analysis suggests persistent challenges despite overall market growth."
                },
                "customized_dei_section": "This customized section highlights DEI aspects including economic disparities affecting marginalized groups, funding gaps, and barriers to economic participation."
            }
        
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