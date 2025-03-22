import cohere
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import os
from api.database import Database

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class GenerativeNewsSynthesis:
    def __init__(self):
        """
        Initialize the Generative News Synthesis module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        self.db = Database()

    def fetch_articles_from_db(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch articles from the database.
        
        Args:
            limit (int): Maximum number of articles to fetch
            
        Returns:
            List[Dict[str, Any]]: List of articles from database
        """
        db_articles = self.db.fetch_articles(limit)
        
        # Format database articles to expected structure
        articles = []
        for article in db_articles:
            articles.append({
                'id': article.get('id', ''),
                'title': article.get('title', ''),
                'content': article.get('content', article.get('body', ''))
            })
        
        return articles

    def fetch_synthesized_article(self, article_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetch a previously synthesized article from the database.
        
        Args:
            article_id (Optional[str]): ID of the synthesized article to fetch, or None for most recent
            
        Returns:
            Optional[Dict[str, Any]]: Synthesized article or None if not found
        """
        if not self.db.tables_exist:
            logger.warning("Skipping fetch_synthesized_article: Tables don't exist yet")
            return None
            
        try:
            response = None
            if article_id:
                # Fetch specific synthesized article
                response = self.db.client.table(f'{self.db.table_prefix}synthesized_articles') \
                    .select('*') \
                    .eq('id', article_id) \
                    .execute()
            else:
                # Fetch most recent synthesized article
                response = self.db.client.table(f'{self.db.table_prefix}synthesized_articles') \
                    .select('*') \
                    .order('created_at', desc=True) \
                    .limit(1) \
                    .execute()
            
            if response and response.data and len(response.data) > 0:
                article = response.data[0]
                source_ids = []
                if article.get('source_ids'):
                    try:
                        source_ids = json.loads(article.get('source_ids', '[]'))
                    except json.JSONDecodeError:
                        source_ids = []
                
                return {
                    'id': article.get('id', ''),
                    'title': article.get('title', ''),
                    'body': article.get('content', ''),
                    'source_ids': source_ids,
                    'created_at': article.get('created_at', '')
                }
            
            return None
        except Exception as e:
            logger.error(f"Error fetching synthesized article: {str(e)}")
            return None

    def synthesize_articles(self, articles: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Synthesize multiple news articles into a balanced, cohesive narrative.
        
        Args:
            articles (List[Dict[str, str]]): List of article dictionaries with 'title' and 'content' keys
            
        Returns:
            Dict[str, Any]: Structured data containing synthesized article
        """
        # If articles list is empty, fetch from database
        if not articles:
            articles = self.fetch_articles_from_db()
            
        # If still empty, return error
        if not articles:
            raise ValueError("No articles available for synthesis")
            
        # Prepare the prompt with all articles
        prompt = "Synthesize the following news articles into a balanced, objective narrative:\n\n"
        for i, article in enumerate(articles, 1):
            content = article.get('content', article.get('body', ''))
            prompt += f"Article {i}:\nTitle: {article['title']}\nContent: {content}\n\n"
        
        prompt += "\nPlease provide a balanced synthesis that:\n"
        prompt += "1. Maintains objectivity\n"
        prompt += "2. Combines different perspectives\n"
        prompt += "3. Avoids bias\n"
        prompt += "4. Creates a cohesive narrative\n\n"
        prompt += "Format the output as:\nTitle: [synthesized title]\nBody: [synthesized content]\nSummary: [brief summary]"

        # Generate the synthesized article
        try:
            response = self.client.chat(
                message=prompt,
                model="command",
                temperature=0.7
            )
            
            # Extract the text from the chat response
            generated_text = response.text
            
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

            result = {
                "title": title,
                "body": body.strip(),
                "summary": summary.strip()
            }
            
            # Save the synthesized article to the database
            source_ids = [article.get('id', f"article_{i}") for i, article in enumerate(articles)]
            self.db.save_synthesized_article(title, body.strip(), source_ids)
        
        except Exception as e:
            logger.error(f"Error calling Cohere API: {str(e)}")
            
            # Try to fetch a previously synthesized article from the database
            try:
                synthesized = self.fetch_synthesized_article()
                if synthesized:
                    logger.info("Using previously synthesized article from database")
                    result = {
                        "title": synthesized.get('title', ''),
                        "body": synthesized.get('body', ''),
                        "summary": "A synthesis of multiple news sources on this topic."
                    }
                else:
                    # Create a minimal synthesis if no previous synthesis is available
                    titles = [article.get('title', '') for article in articles if article.get('title')]
                    result = {
                        "title": "Synthesis of Related Articles",
                        "body": "This synthesis combines multiple perspectives on the topic.\n\n" + 
                               "\n\n".join([f"From article '{title}': " for title in titles]),
                        "summary": "A synthesis of " + str(len(articles)) + " related news articles."
                    }
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                # Create a minimal synthesis if database access fails
                result = {
                    "title": "Synthesis of News Articles",
                    "body": "This synthesis combines information from multiple news sources on this topic.",
                    "summary": "A synthesis of related news articles on this topic."
                }
        
        return result

    def format_output(self, synthesis_result: Dict[str, Any]) -> str:
        """
        Format the synthesis result as a JSON string.
        
        Args:
            synthesis_result (Dict[str, Any]): The synthesis result to format
            
        Returns:
            str: JSON string representation of the synthesis result
        """
        return json.dumps(synthesis_result, indent=2) 