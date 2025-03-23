import os
import cohere
from typing import List, Dict, Any

class NeutralArticleGenerator:
    """Class to generate neutral articles based on multiple sources"""
    
    def __init__(self):
        """Initialize the neutral article generator with a Cohere client"""
        self.co = cohere.Client(os.getenv('COHERE_API_KEY'))
        if not os.getenv('COHERE_API_KEY'):
            print("WARNING: COHERE_API_KEY not found in environment variables")
    
    def generate_neutral_article(self, articles):
        """
        Generate a neutral article based on the provided articles
        """
        if not articles or len(articles) < 2:
            print("Insufficient articles to generate a neutral version")
            return {"title": "Not enough sources", "content": "At least two articles are needed to generate a neutral article."}
        
        # Log the number of articles being used as sources
        print(f"\nGenerating neutral article from {len(articles)} sources:")
        for i, article in enumerate(articles):
            bias = article.get('bias_score', 'Unknown')
            title = article.get('title', 'No title')
            print(f"  Source {i+1}: '{title}' (Bias: {bias})")

        # Create the prompt for generating a neutral article
        prompt = self._create_neutral_article_prompt(articles)
        
        try:
            print(f"\nSending request to Cohere API...")
            response = self.co.generate(
                model='command',  # Use the correct model
                prompt=prompt,
                max_tokens=1000,
                temperature=0.7,
                num_generations=1  # Request only one generation
            )
            generated_text = response.generations[0].text
            
            # Extract title and content from generated text
            lines = generated_text.strip().split('\n')
            title = lines[0].replace('# ', '').strip() if lines and lines[0].startswith('# ') else "Generated Neutral Article"
            content = '\n'.join(lines[1:]).strip() if len(lines) > 1 else "Content generation failed."
            
            # Display the generated content
            print(f"\nSuccessfully generated neutral article:")
            print(f"  Title: {title}")
            print(f"  Content length: {len(content)} characters")
            
            # Print a preview of the content
            content_preview = content[:300] + ("..." if len(content) > 300 else "")
            print(f"\nContent Preview:\n{content_preview}")
            
            return {
                "title": title,
                "content": content
            }
        
        except Exception as e:
            print(f"Error generating neutral article: {str(e)}")
            return {"title": "Generation Error", "content": f"Failed to generate a neutral article: {str(e)}"}
            
    def _create_neutral_article_prompt(self, articles):
        """Create a prompt for generating a neutral article based on provided article data"""
        # Prepare the prompt header
        prompt = "Generate a neutral and objective news article based on the following sources. "
        prompt += "The article must be factual, unbiased, and present multiple perspectives if applicable. "
        prompt += "Include a title starting with '# ' on the first line.\n\n"
        
        prompt += "SOURCES:\n"
        
        # Extract key information from each article
        for i, article in enumerate(articles):
            title = article.get('title', 'No title')
            bias_score = article.get('bias_score', 'Unknown')
            
            # Get the content, handling potential missing content
            content = article.get('content', "No content available")
            
            # Truncate content if it's too long (keeping beginning and end)
            if len(content) > 1000:
                first_part = content[:600]
                last_part = content[-400:]
                content = f"{first_part}...[content truncated]...{last_part}"
            
            prompt += f"SOURCE {i+1} (Bias Score: {bias_score}):\n"
            prompt += f"Title: {title}\n"
            prompt += f"Content: {content}\n\n"
        
        # Add instructions for the output format
        prompt += "\nBased on the sources above, write a comprehensive, neutral article that accurately "
        prompt += "synthesizes the factual information while avoiding bias. "
        prompt += "The article should be well-structured and present a balanced view of the topic. "
        prompt += "Format the output with a title starting with '# ' followed by the article content."
        
        print(f"\nCreated prompt with {len(prompt)} characters")
        return prompt 