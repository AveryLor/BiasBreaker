import cohere
import json
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class NeutralityCheck:
    def __init__(self):
        """
        Initialize the Neutrality Check module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def evaluate_neutrality(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the political bias of the article on a scale from 0 to 100.
        
        Args:
            article_data (Dict[str, Any]): Dictionary containing the article and DEI data
            
        Returns:
            Dict[str, Any]: Dictionary containing the bias score (0-100)
        """
        # Extract the article content
        article = article_data.get('customized_article', article_data.get('updated_article', {}))
        dei_section = article_data.get('customized_dei_section', article_data.get('dei_section', ''))
        
        # Prepare the prompt for bias evaluation
        prompt = f"""Evaluate the political bias of this article and provide ONLY a score from 0 to 100, where:
- 0 represents extreme left bias
- 50 represents perfect neutrality/balance
- 100 represents extreme right bias

Article:
Title: {article.get('title', '')}
Content: {article.get('content', '')}

DEI Section:
{dei_section}

Respond with ONLY the number, nothing else."""

        # Generate the evaluation
        response = self.client.generate(
            model='large',
            prompt=prompt,
            max_tokens=10,
            temperature=0.3
        )

        # Parse the generated text to get just the number
        generated_text = response.generations[0].text.strip()
        try:
            # Extract the first number found in the text
            score = int(''.join(filter(str.isdigit, generated_text)))
            # Ensure the score is between 0 and 100
            score = max(0, min(100, score))
        except (ValueError, IndexError):
            score = 50  # Default to neutral score if parsing fails

        return {
            "bias_score": score
        }

    def format_output(self, evaluation_result: Dict[str, Any]) -> str:
        """
        Format the evaluation result as a JSON string.
        
        Args:
            evaluation_result (Dict[str, Any]): The evaluation result to format
            
        Returns:
            str: JSON string representation of the evaluation result
        """
        return json.dumps(evaluation_result, indent=2) 