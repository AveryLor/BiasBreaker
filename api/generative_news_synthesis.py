import cohere
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class GenerativeNewsSynthesis:
    def __init__(self):
        """
        Initialize the Generative News Synthesis module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def synthesize_articles(self, articles: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Synthesize multiple news articles into a balanced, cohesive narrative.
        
        Args:
            articles (List[Dict[str, str]]): List of article dictionaries with 'title' and 'content' keys
            
        Returns:
            Dict[str, Any]: Structured data containing synthesized article
        """
        # Prepare the prompt with all articles
        prompt = "Synthesize the following news articles into a balanced, objective narrative:\n\n"
        for i, article in enumerate(articles, 1):
            prompt += f"Article {i}:\nTitle: {article['title']}\nContent: {article['content']}\n\n"
        
        prompt += "\nPlease provide a balanced synthesis that:\n"
        prompt += "1. Maintains objectivity\n"
        prompt += "2. Combines different perspectives\n"
        prompt += "3. Avoids bias\n"
        prompt += "4. Creates a cohesive narrative\n\n"
        prompt += "Format the output as:\nTitle: [synthesized title]\nBody: [synthesized content]\nSummary: [brief summary]"

        # Generate the synthesized article
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
        title = ""
        body = ""
        summary = ""
        
        current_section = None
        for line in sections:
            if line.startswith('Title:'):
                current_section = 'title'
                title = line.replace('Title:', '').strip()
            elif line.startswith('Body:'):
                current_section = 'body'
            elif line.startswith('Summary:'):
                current_section = 'summary'
            elif line.strip() and current_section == 'body':
                body += line + '\n'
            elif line.strip() and current_section == 'summary':
                summary += line + '\n'

        return {
            "title": title,
            "body": body.strip(),
            "summary": summary.strip()
        }

    def format_output(self, synthesis_result: Dict[str, Any]) -> str:
        """
        Format the synthesis result as a JSON string.
        
        Args:
            synthesis_result (Dict[str, Any]): The synthesis result to format
            
        Returns:
            str: JSON string representation of the synthesis result
        """
        return json.dumps(synthesis_result, indent=2) 