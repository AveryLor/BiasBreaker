import cohere
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class UnderrepresentedVoices:
    def __init__(self):
        """
        Initialize the Underrepresented Voices module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def identify_underrepresented_perspectives(self, article: Dict[str, str]) -> Dict[str, Any]:
        """
        Identify and highlight underrepresented or marginalized perspectives in the article.
        
        Args:
            article (Dict[str, str]): Article dictionary with 'title' and 'body' keys
            
        Returns:
            Dict[str, Any]: Structured data containing main article and highlighted segments
        """
        # Prepare the prompt for identifying underrepresented voices
        prompt = f"""Analyze the following article and identify segments that represent underrepresented or marginalized perspectives:

Title: {article['title']}
Content: {article['body']}

Please identify:
1. Key phrases or segments that represent underrepresented voices
2. The demographic or group these voices represent
3. The context in which these perspectives are presented

Format the output as:
UNDERREPRESENTED_SEGMENTS:
[list of identified segments with their context]

DEMOGRAPHICS:
[list of identified demographics]
"""

        # Generate the analysis
        response = self.client.generate(
            model='large',
            prompt=prompt,
            max_tokens=500,
            temperature=0.3
        )

        # Parse the generated text
        generated_text = response.generations[0].text
        
        # Split the generated text into sections
        sections = generated_text.split('\n')
        underrepresented_segments = []
        demographics = []
        
        current_section = None
        for line in sections:
            if line.startswith('UNDERREPRESENTED_SEGMENTS:'):
                current_section = 'segments'
            elif line.startswith('DEMOGRAPHICS:'):
                current_section = 'demographics'
            elif line.strip() and current_section == 'segments':
                underrepresented_segments.append(line.strip())
            elif line.strip() and current_section == 'demographics':
                demographics.append(line.strip())

        return {
            "main_article": article,
            "underrepresented": {
                "segments": underrepresented_segments,
                "demographics": demographics
            }
        }

    def format_output(self, analysis_result: Dict[str, Any]) -> str:
        """
        Format the analysis result as a JSON string.
        
        Args:
            analysis_result (Dict[str, Any]): The analysis result to format
            
        Returns:
            str: JSON string representation of the analysis result
        """
        return json.dumps(analysis_result, indent=2) 