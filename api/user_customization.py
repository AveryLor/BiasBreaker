import cohere
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class UserCustomization:
    def __init__(self):
        """
        Initialize the User Customization module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def customize_dei_emphasis(self, article_data: Dict[str, Any], customization_settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Customize the DEI emphasis in the article based on user settings.
        
        Args:
            article_data (Dict[str, Any]): Dictionary containing the article and DEI data
            customization_settings (Dict[str, Any]): User preferences for DEI emphasis
            
        Returns:
            Dict[str, Any]: Structured data containing customized article and settings
        """
        # Extract the article and DEI data
        updated_article = article_data.get('updated_article', {})
        dei_section = article_data.get('dei_section', '')
        
        # Prepare the prompt for customization
        prompt = f"""Customize the following article based on these DEI emphasis settings:

Settings:
{json.dumps(customization_settings, indent=2)}

Article:
Title: {updated_article.get('title', '')}
Content: {updated_article.get('content', '')}

DEI Section:
{dei_section}

Please:
1. Adjust the emphasis on underrepresented voices based on the settings
2. Modify the DEI section to reflect the desired level of emphasis
3. Ensure the customization maintains the article's objectivity
4. Keep the core message intact while adjusting the focus

Format the output as:
CUSTOMIZED_ARTICLE:
Title: [customized title]
Content: [customized content]

CUSTOMIZED_DEI_SECTION:
[customized DEI content]
"""

        # Generate the customized version
        response = self.client.generate(
            model='large',
            prompt=prompt,
            max_tokens=1000,
            temperature=0.7
        )

        # Parse the generated text
        generated_text = response.generations[0].text
        
        # Split the generated text into sections
        sections = generated_text.split('\n')
        customized_title = ""
        customized_content = ""
        customized_dei = ""
        
        current_section = None
        for line in sections:
            if line.startswith('CUSTOMIZED_ARTICLE:'):
                current_section = 'article'
            elif line.startswith('CUSTOMIZED_DEI_SECTION:'):
                current_section = 'dei'
            elif line.startswith('Title:'):
                customized_title = line.replace('Title:', '').strip()
            elif line.strip() and current_section == 'article' and not line.startswith('Title:'):
                customized_content += line + '\n'
            elif line.strip() and current_section == 'dei':
                customized_dei += line + '\n'

        return {
            "customization": {
                "settings": customization_settings,
                "applied": True
            },
            "customized_article": {
                "title": customized_title,
                "content": customized_content.strip()
            },
            "customized_dei_section": customized_dei.strip()
        }

    def format_output(self, customization_result: Dict[str, Any]) -> str:
        """
        Format the customization result as a JSON string.
        
        Args:
            customization_result (Dict[str, Any]): The customization result to format
            
        Returns:
            str: JSON string representation of the customization result
        """
        return json.dumps(customization_result, indent=2) 