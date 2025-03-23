import cohere
import json
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# FastAPI backend URL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

class NaturalLanguageUnderstanding:
    def __init__(self):
        """
        Initialize the Natural Language Understanding module with Cohere API key.
        """
        self.client = cohere.Client(os.getenv('COHERE_API_KEY'))
        # Add conversation history to maintain context
        self.conversation_history = []
        # Max number of exchanges to remember
        self.max_history_length = 5

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a user query using Cohere's API to provide a conversational response
        and retrieve relevant news articles.
        
        Args:
            query (str): The user query
            
        Returns:
            Dict[str, Any]: Response containing chatbot message and relevant articles
        """
        try:
            logger.debug(f"Processing query: {query}")
            
            # Extract keywords from the query
            analysis = self._analyze_query(query)
            
            # Fetch relevant articles based on keywords using FastAPI backend
            articles = self._search_articles_by_keywords(analysis['keywords'])
            
            # Only generate a response if we found relevant articles
            if articles:
                response = self._generate_response(query, analysis, articles)
            else:
                response = "I'm sorry, I don't have any information about that in my database. Could you try asking about something else?"
            
            # Add to conversation history
            self._update_conversation_history(query, response)
            
            # Save the analysis result to the database via FastAPI backend
            try:
                self._save_analysis_result(query, analysis)
            except Exception as e:
                logger.error(f"Error saving to database: {str(e)}")
            
            return {
                "analysis": analysis,
                "articles": articles,
                "response": response
            }
            
        except Exception as e:
            logger.error(f"Unexpected error in process_query: {str(e)}")
            return {
                "analysis": {
                    "topic": "general",
                    "context": "Unable to process query",
                    "keywords": ["error"]
                },
                "articles": [],
                "response": "I'm sorry, I don't have any information about that in my database. Could you try asking about something else?"
            }
    
    def _analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze the query to extract topic and keywords.
        """
        try:
            # Use Cohere's chat API for topic classification
            topic_prompt = f"""Analyze this query and determine the main topic. Choose from these options:
            - renewable energy
            - business impact
            - environment
            - artificial intelligence
            - general
            
            Format your response as just the topic name, nothing else.
            
            Query: {query}"""
            
            topic_response = self.client.chat(
                message=topic_prompt,
                model="command", 
                temperature=0.3
            )
            
            # Extract just the topic name
            topic = topic_response.text.strip().lower()
            
            # Make sure we're only taking the first line, and removing any extra text
            if '\n' in topic:
                topic = topic.split('\n')[0]
            
            # Standardize common responses
            if 'artificial' in topic or 'ai' in topic or 'machine learning' in topic:
                topic = "artificial intelligence"
            elif 'renewable' in topic or 'energy' in topic:
                topic = "renewable energy"
            elif 'business' in topic or 'economic' in topic:
                topic = "business impact"
            elif 'environment' in topic or 'climate' in topic:
                topic = "environment"
            elif topic not in ["renewable energy", "business impact", "environment", "artificial intelligence"]:
                topic = "general"
            
        except Exception as e:
            logger.error(f"Error calling chat API for topic: {str(e)}")
            # Fall back to database for similar queries
            try:
                prev_analyses = self._fetch_previous_analyses("natural_language_understanding", 5)
                if prev_analyses:
                    # Find the most similar previous query
                    import difflib
                    similarities = [(difflib.SequenceMatcher(None, query.lower(), a['query'].lower()).ratio(), a) for a in prev_analyses]
                    best_match = max(similarities, key=lambda x: x[0])
                    if best_match[0] > 0.6:  # If similarity is greater than 60%
                        result_data = json.loads(best_match[1]['result'])
                        topic = result_data.get('topic', 'general')
                        logger.info(f"Using topic from similar previous query: {topic}")
                    else:
                        topic = "general"
                else:
                    topic = "general"
            except Exception as db_err:
                logger.error(f"Error fetching from database: {str(db_err)}")
                topic = "general"
        
        # Extract keywords
        try:
            # Use chat API for keyword extraction
            keywords_prompt = f"""Extract the most important keywords from this query as a comma-separated list:
            
            Query: {query}
            
            Format your response as JUST the keywords, separated by commas. Don't include any other text.
            Example: keyword1, keyword2, keyword3
            """
            
            keywords_response = self.client.chat(
                message=keywords_prompt,
                model="command",
                temperature=0.3
            )
            
            # Extract keywords as a list
            keywords_text = keywords_response.text.strip()
            # Cleanup response - remove common prefixes 
            prefixes_to_remove = [
                "here are the most important keywords", 
                "here are the keywords", 
                "the keywords are", 
                "sure", 
                "certainly"
            ]
            for prefix in prefixes_to_remove:
                if keywords_text.lower().startswith(prefix):
                    # Find the first colon or comma after the prefix
                    colon_pos = keywords_text.find(":")
                    if colon_pos > 0:
                        keywords_text = keywords_text[colon_pos+1:].strip()
            
            # Only take the first line if there are multiple
            if '\n' in keywords_text:
                keywords_text = keywords_text.split('\n')[0]
                
            keywords = [k.strip() for k in keywords_text.split(',') if k.strip()]
            
            # Filter out likely non-keywords
            keywords = [k for k in keywords if len(k) > 1 and ":" not in k and not k.startswith("format")]
            
            # Limit to a maximum of 5 keywords
            keywords = keywords[:5]
            
            # If no keywords were extracted, provide defaults based on topic
            if not keywords:
                if topic == "artificial intelligence":
                    keywords = ["artificial intelligence", "machine learning"]
                elif topic == "renewable energy":
                    keywords = ["renewable energy", "sustainability"]
                elif topic == "business impact":
                    keywords = ["economics", "business"]
                elif topic == "environment":
                    keywords = ["environment", "climate"]
                else:
                    keywords = ["general", "information"]
            
        except Exception as e:
            logger.error(f"Error calling chat API for keywords: {str(e)}")
            # Default keywords based on topic
            if topic == "artificial intelligence":
                keywords = ["artificial intelligence", "machine learning"]
            elif topic == "renewable energy":
                keywords = ["renewable energy", "sustainability"]
            elif topic == "business impact":
                keywords = ["economics", "business"]
            elif topic == "environment":
                keywords = ["environment", "climate"]
            else:
                keywords = ["general", "information"]
        
        return {
            "topic": topic,
            "keywords": keywords
        }
    
    def _search_articles_by_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Search articles in the database by making HTTP requests to the FastAPI backend.
        Focuses on finding keywords in the news_information column.
        """
        if not keywords:
            return []
        
        relevant_articles = []
        matched_article_ids = set()
        
        try:
            # Search for each keyword individually using the dedicated search endpoint
            for keyword in keywords:
                try:
                    logger.debug(f"Searching for keyword: {keyword}")
                    response = requests.get(
                        f"{BACKEND_URL}/search?query={keyword}", 
                        timeout=5
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Error searching for keyword '{keyword}': {response.status_code}")
                        continue
                        
                    articles = response.json()
                    logger.debug(f"Found {len(articles)} articles matching keyword '{keyword}'")
                    
                    # Add each matching article to our result set
                    for article in articles:
                        article_id = article.get('id')
                        
                        # Skip if we've already matched this article
                        if article_id in matched_article_ids:
                            continue
                            
                        source_name = article.get('source_name', '')
                        news_information = article.get('news_information', '')
                        
                        # Add to our results
                        matched_article_ids.add(article_id)
                        relevant_articles.append({
                            'id': article_id,
                            'title': source_name,
                            'summary': news_information[:200] + '...' if news_information and len(news_information) > 200 else news_information,
                            'relevance': f"Matches keyword: '{keyword}'"
                        })
                        
                except requests.exceptions.ConnectionError:
                    logger.error(f"Could not connect to the backend at {BACKEND_URL}. Is the server running?")
                    continue
                except requests.exceptions.Timeout:
                    logger.error(f"Request to {BACKEND_URL}/search timed out after 5 seconds")
                    continue
                except Exception as e:
                    logger.error(f"Error searching for keyword '{keyword}': {str(e)}")
                    continue
            
            logger.debug(f"Total relevant articles found: {len(relevant_articles)}")
            
            # If no relevant articles found, fallback to getting all articles and filtering
            if not relevant_articles:
                logger.warning("No articles found with search endpoint, trying fallback method")
                return self._fallback_article_search(keywords)
            
        except Exception as e:
            logger.error(f"Error in keyword search: {str(e)}")
            return self._fallback_article_search(keywords)
        
        return relevant_articles
    
    def _fallback_article_search(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Fallback method to get all articles and filter them by keywords.
        Used when the search endpoint fails.
        """
        logger.debug("Using fallback article search method")
        relevant_articles = []
        matched_article_ids = set()
        
        try:
            # Get all news articles from the backend
            response = requests.get(f"{BACKEND_URL}/news", timeout=5)
            
            if response.status_code != 200:
                logger.error(f"Error fetching articles from backend: {response.status_code}")
                return self._get_mock_articles_for_keywords(keywords)
            
            articles = response.json()
            logger.debug(f"Retrieved {len(articles)} articles for manual filtering")
            
            # If no articles were returned, use mock data
            if not articles:
                logger.warning(f"No articles returned from backend, using mock data")
                return self._get_mock_articles_for_keywords(keywords)
            
            # Filter articles based on keywords
            for article in articles:
                # Extract article fields
                article_id = article.get('id')
                source_name = article.get('source_name', '')
                news_information = article.get('news_information', '')
                
                # Skip if we've already matched this article
                if article_id in matched_article_ids:
                    continue
                
                # Focus on searching in the news_information column
                article_text = news_information.lower() if news_information else ""
                matching_keywords = []
                
                for keyword in keywords:
                    if keyword.lower() in article_text:
                        matching_keywords.append(keyword)
                
                # If we found matches, add this article to our results
                if matching_keywords:
                    matched_article_ids.add(article_id)
                    relevant_articles.append({
                        'id': article_id,
                        'title': source_name,
                        'summary': news_information[:200] + '...' if news_information and len(news_information) > 200 else news_information,
                        'relevance': f"Matches keywords: {', '.join(matching_keywords)}"
                    })
            
            logger.debug(f"Fallback search found {len(relevant_articles)} relevant articles")
            
            # If still no relevant articles found, use mock data
            if not relevant_articles:
                logger.warning(f"No relevant articles found for keywords, using mock data")
                return self._get_mock_articles_for_keywords(keywords)
            
        except Exception as e:
            logger.error(f"Error in fallback article search: {str(e)}")
            return self._get_mock_articles_for_keywords(keywords)
        
        return relevant_articles
    
    def _get_mock_articles_for_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Generate mock articles for testing when the backend is not available.
        Only used when the backend fails to provide real articles.
        """
        logger.info(f"Generating mock articles for keywords: {keywords}")
        
        mock_articles = []
        
        # Create a mock article for each keyword
        for i, keyword in enumerate(keywords, 1):
            mock_articles.append({
                'id': f"mock-{i}",
                'title': f"Sample Article about {keyword.title()}",
                'summary': f"This is a sample article about {keyword}. It contains information relevant to the topic, " 
                          f"but is generated for testing purposes when the backend database is not available.",
                'relevance': f"Matches keyword: '{keyword}'"
            })
        
        return mock_articles
    
    def _save_analysis_result(self, query: str, analysis: Dict[str, Any]) -> bool:
        """
        Save analysis results to the database via FastAPI backend.
        """
        try:
            # Create the analysis request
            analysis_data = {
                "query": query,
                "analysis": analysis
            }
            
            # Send the analysis to the backend
            try:
                response = requests.post(
                    f"{BACKEND_URL}/analyze-query", 
                    json={"query": query},
                    timeout=5
                )
            except requests.exceptions.ConnectionError:
                logger.error(f"Could not connect to the backend at {BACKEND_URL}. Is the server running?")
                return False
            except requests.exceptions.Timeout:
                logger.error(f"Request to {BACKEND_URL}/analyze-query timed out after 5 seconds")
                return False
            except Exception as e:
                logger.error(f"Unexpected error connecting to backend: {str(e)}")
                return False
            
            if response.status_code == 200:
                return True
            else:
                logger.error(f"Error saving analysis: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error saving analysis to backend: {str(e)}")
            return False
    
    def _fetch_previous_analyses(self, module: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch previous analysis results from the database via FastAPI backend.
        """
        try:
            # This would require a new endpoint in the FastAPI backend
            # For now, we'll return an empty list
            return []
                
        except Exception as e:
            logger.error(f"Error fetching previous analyses: {str(e)}")
            return []
    
    def _generate_response(self, query: str, analysis: Dict[str, Any], articles: List[Dict[str, Any]]) -> str:
        """
        Generate a conversational response based on the query, analysis, and articles.
        Only called when there are matching articles in the database.
        """
        try:
            # Build conversation history for context
            conversation_context = ""
            if self.conversation_history:
                conversation_context = "Previous conversation:\n"
                for exchange in self.conversation_history:
                    conversation_context += f"User: {exchange['query']}\nAssistant: {exchange['response']}\n"
            
            # Build article information
            articles_info = ""
            if articles:
                articles_info = "I found these relevant articles that match the user's query:\n"
                for i, article in enumerate(articles, 1):
                    articles_info += f"{i}. {article['title']}\n"
                    articles_info += f"   Summary: {article['summary']}\n"
                    articles_info += f"   Relevance: {article['relevance']}\n"
            
            # Build the prompt for the chatbot response
            response_prompt = f"""You are a friendly and helpful chatbot assistant named Genesis. Your primary purpose is to provide 
            information from news articles in your database. You should focus on sharing information ONLY from the articles found
            and not make up information.
            
            {conversation_context}
            
            User's current query: {query}
            
            Topic of the query: {analysis['topic']}
            Keywords searched: {', '.join(analysis['keywords'])}
            
            {articles_info}
            
            Provide a helpful response to the user that only discusses information found in these articles. Use natural, conversational
            language without explicitly saying "I found these articles" - instead incorporate the information naturally. If there are
            multiple articles, try to synthesize the information. Always stick to what's found in the articles.
            """
            
            # Generate response using Cohere
            response = self.client.chat(
                message=response_prompt,
                model="command",
                temperature=0.7  # Slightly higher temperature for more varied responses
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I found some information about that, but I'm having trouble processing it. Could you try asking in a different way?"
    
    def _update_conversation_history(self, query: str, response: str):
        """
        Update the conversation history with the latest exchange.
        """
        self.conversation_history.append({
            "query": query,
            "response": response
        })
        
        # Limit the history length
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]
    
    def format_output(self, analysis_result: Dict[str, Any]) -> str:
        """
        Format the analysis result as a JSON string.
        
        Args:
            analysis_result (Dict[str, Any]): The analysis result to format
            
        Returns:
            str: JSON string representation of the analysis result
        """
        return json.dumps(analysis_result, indent=2) 