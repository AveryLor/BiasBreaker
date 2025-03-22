import cohere
import json
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class NaturalLanguageUnderstanding:
    def __init__(self):
        """
        Initialize the Natural Language Understanding module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a raw user query using Cohere's API to extract key information.
        
        Args:
            query (str): The raw user query to analyze
            
        Returns:
            Dict[str, Any]: Structured data containing topic, context, and keywords
        """
        # Use Cohere's classify endpoint to analyze the query
        response = self.client.classify(
            model='large',
            inputs=[query],
            examples=[
                {"text": "What are the latest developments in renewable energy?", "label": "topic: renewable energy"},
                {"text": "How has the pandemic affected small businesses?", "label": "topic: business impact"},
                {"text": "What are the environmental effects of deforestation?", "label": "topic: environment"}
            ]
        )

        # Extract topic from classification
        topic = response.classifications[0].labels[0].name.split(': ')[1]

        # Use Cohere's generate endpoint to get context and keywords
        prompt = f"Analyze this query and provide context and keywords: {query}"
        generation = self.client.generate(
            model='large',
            prompt=prompt,
            max_tokens=100,
            temperature=0.3
        )

        # Parse the generation to extract context and keywords
        generated_text = generation.generations[0].text
        context = generated_text.split('\n')[0] if '\n' in generated_text else generated_text
        
        # Extract keywords using Cohere's classify endpoint
        keywords_response = self.client.classify(
            model='large',
            inputs=[query],
            examples=[
                {"text": "renewable energy solar wind power", "label": "keywords: renewable, energy, solar, wind, power"},
                {"text": "climate change global warming carbon emissions", "label": "keywords: climate, change, global, warming, carbon, emissions"}
            ]
        )
        
        keywords = keywords_response.classifications[0].labels[0].name.split(': ')[1].split(', ')

        return {
            "topic": topic,
            "context": context,
            "keywords": keywords
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