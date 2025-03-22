import cohere
import json
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class DEIFocus:
    def __init__(self):
        """
        Initialize the DEI Focus module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def emphasize_dei(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adjust the article to emphasize Diversity, Equity, and Inclusion (DEI).
        
        Args:
            article_data (Dict[str, Any]): Dictionary containing the article and underrepresented voices data
            
        Returns:
            Dict[str, Any]: Structured data containing updated article and DEI-focused content
        """
        # Extract the main article and underrepresented voices data
        main_article = article_data.get('main_article', {})
        underrepresented = article_data.get('underrepresented', {})
        
        # Prepare the prompt for DEI emphasis
        prompt = f"""Reframe the following article to emphasize Diversity, Equity, and Inclusion (DEI):

Original Article:
Title: {main_article.get('title', '')}
Content: {main_article.get('body', '')}

Underrepresented Voices:
{json.dumps(underrepresented, indent=2)}

Please:
1. Reframe the narrative to give prominent emphasis to diverse perspectives
2. Ensure equitable representation of all voices
3. Maintain the article's objectivity while highlighting DEI aspects
4. Create a dedicated DEI section that emphasizes these perspectives

Format the output as:
UPDATED_ARTICLE:
Title: [new title]
Content: [reframed content]

DEI_SECTION:
[dedicated DEI-focused content]
"""

        # Generate the DEI-focused version
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
        updated_title = ""
        updated_content = ""
        dei_section = ""
        
        current_section = None
        for line in sections:
            if line.startswith('UPDATED_ARTICLE:'):
                current_section = 'article'
            elif line.startswith('DEI_SECTION:'):
                current_section = 'dei'
            elif line.startswith('Title:'):
                updated_title = line.replace('Title:', '').strip()
            elif line.strip() and current_section == 'article' and not line.startswith('Title:'):
                updated_content += line + '\n'
            elif line.strip() and current_section == 'dei':
                dei_section += line + '\n'

        return {
            "updated_article": {
                "title": updated_title,
                "content": updated_content.strip()
            },
            "dei_section": dei_section.strip()
        }

    def format_output(self, dei_result: Dict[str, Any]) -> str:
        """
        Format the DEI result as a JSON string.
        
        Args:
            dei_result (Dict[str, Any]): The DEI result to format
            
        Returns:
            str: JSON string representation of the DEI result
        """
        return json.dumps(dei_result, indent=2) 