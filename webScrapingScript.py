from bs4 import BeautifulSoup
from supabase import create_client, Client
import requests
import time
import re
import csv
import json
import sys
import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

# Your Supabase credentials 
SUPABASE_URL = 'https://jexfgqihwnhyehxwxmeq.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGZncWlod25oeWVoeHd4bWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NjMxOTUsImV4cCI6MjA1ODIzOTE5NX0.H4Wh-b3cqxBH-srLTFxYBriY6XuhKj1ZhjFCOfaqWI4'

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of news sources with their URLs
news_sources = {
    'CBC News': 'https://www.cbc.ca/',
    
}


# Function to insert news sources into Supabase
def insert_news_sources(supabase, source_name, source_link, news_information, article_titles):
    try:
        # Create a dictionary with the data to insert
        data = {
            'source_name': source_name,
            'source_link': source_link,
            'news_information': news_information,
            'article_titles': article_titles
        }
        
        # Insert the data into the 'news' table
        response = supabase.table('articleInformationDB').insert(data).execute()
        
        if response.data:
            print(f"Successfully inserted article from {source_name}")
        else:
            print(f"Failed to insert article from {source_name}")
    
    except Exception as e:
        print(f"Failed to insert article from {source_name}: {e}")

print(f"Processing {len(news_sources)} news sources\n")


# Function to determine if URL is likely an article
def is_likely_article(url, base_domain):
    # More comprehensive non-article patterns
    non_article_patterns = [
        '/television', '/listen', '/radio', '/music', '/sports',
        '/about', '/contact', '/help', '/faq', '/advertise', '/subscribe',
        '/weather', '/video', '/live', '/podcasts', '/player',
        '/account', '/login', '/register', '/signup', '/profile',
        '/search', '/terms', '/privacy', '/sitemap', '/rss',
        '/shows', '/schedule', '/listings', '/program',
        '/tag/', '/category/', '/author/', '/topics/', '/feed/',
        '/newsletter/', '/subscription/', '/shop/', '/store/',
        '/photos/', '/images/', '/gallery/', '/multimedia/'
    ]
    
    # More specific article patterns that strongly indicate news articles
    article_patterns = [
        r'/\d{4}/\d{2}/\d{2}/',  # Date pattern: /yyyy/mm/dd/
        r'/\d{4}-\d{2}-\d{2}/',  # Date pattern: /yyyy-mm-dd/
        r'/news/[a-z0-9-]+',     # News pattern: /news/article-slug
        r'/article/[a-z0-9-]+',  # Article pattern: /article/article-slug
        r'/story/[a-z0-9-]+',    # Story pattern: /story/article-slug
        r'/[0-9]+/[a-z0-9-]+',   # ID pattern: /123456/article-slug
    ]
    
    # First, check if URL matches any non-article patterns
    if any(pattern in url.lower() for pattern in non_article_patterns):
        return False
        
    # Then check for strong article indicators
    if any(re.search(pattern, url.lower()) for pattern in article_patterns):
        return True
    
    # Check URL structure (articles often have 2-4 path segments)
    path = url.split(base_domain)[-1]
    path_segments = [seg for seg in path.split('/') if seg]
    if not (2 <= len(path_segments) <= 4):
        return False
    
    return True

# Add caching for URL validation
@lru_cache(maxsize=1000)
def is_valid_url(url, base_domain):
    try:
        parsed = urlparse(url)
        # Must be http or https
        if not parsed.scheme in ('http', 'https'):
            return False
            
        # Must contain the base domain
        if base_domain not in parsed.netloc:
            return False
            
        # Avoid common file extensions that aren't articles
        if parsed.path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xml', '.json')):
            return False
            
        # Avoid URLs with query parameters (usually not articles)
        if parsed.query:
            return False
            
        return True
    except:
        return False

async def verify_urls(urls, headers):
    """Asynchronously verify multiple URLs"""
    async with aiohttp.ClientSession(headers=headers) as session:
        async def check_url(url):
            try:
                async with session.head(url, timeout=5, allow_redirects=True) as response:
                    return url if response.status == 200 else None
            except:
                return None

        tasks = [check_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return [url for url in results if url]

def normalize_url(href, base_url):
    """Normalize URL with proper error handling"""
    try:
        # Remove fragments
        href = href.split('#')[0]
        # Handle protocol-relative URLs
        if href.startswith('//'):
            href = 'https:' + href
        # Join relative URLs
        return urljoin(base_url, href)
    except:
        return None

def process_links(tags, base_url, base_domain):
    links = set()
    for tag in tags:
        try:
            href = tag['href']
            
            # Normalize the URL
            if href.startswith('//'): 
                href = 'https:' + href
            elif href.startswith('/'):
                href = base_url.rstrip('/') + href
            elif not href.startswith(('http://', 'https://')):
                continue
                
            # Validate URL
            if not is_valid_url(href, base_domain):
                continue
                
            if is_likely_article(href, base_domain):
                links.add(href)
        except:
            continue
    return links

def extract_article_links(soup, base_url, depth=0, visited_urls=None, max_links=15):
    if visited_urls is None:
        visited_urls = set()
    if depth > 2:
        return []
        
    links = set()
    base_domain = urlparse(base_url).netloc
    
    # Define priority areas with scoring
    priority_areas = [
        {
            'elements': soup.find_all(['article']),
            'score': 5
        },
        {
            'elements': soup.find_all(['div', 'section'], class_=lambda c: c and any(x in str(c).lower() for x in [
                'article', 'story', 'news', 'headline'
            ])),
            'score': 4
        },
        {
            'elements': soup.find_all(['main', 'div'], class_=lambda c: c and any(x in str(c).lower() for x in [
                'content', 'container', 'main'
            ])),
            'score': 3
        }
    ]
    
    # Process each priority area
    scored_links = {}
    for area in priority_areas:
        for element in area['elements']:
            for link in element.find_all('a', href=True):
                url = normalize_url(link['href'], base_url)
                if url and is_valid_url(url, base_domain) and url not in visited_urls:
                    scored_links[url] = scored_links.get(url, 0) + area['score']
    
    # Sort links by score
    sorted_links = sorted(scored_links.items(), key=lambda x: x[1], reverse=True)
    candidate_links = [link for link, score in sorted_links]
    
    # Asynchronously verify URLs
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    valid_links = loop.run_until_complete(verify_urls(candidate_links[:max_links], headers))
    loop.close()
    
    return valid_links

def find_section_links(soup, base_url, base_domain, visited_urls):
    section_links = set()
    section_patterns = [
        '/news/', '/world/', '/politics/', '/business/',
        '/latest/', '/breaking/', '/top-stories/', '/headlines/',
        '/canada/', '/us/', '/local/'
    ]
    
    for link in soup.find_all('a', href=True):
        try:
            href = link['href']
            
            # Normalize the URL
            if href.startswith('//'): 
                href = 'https:' + href
            elif href.startswith('/'):
                href = base_url.rstrip('/') + href
            elif not href.startswith(('http://', 'https://')):
                continue
                
            # Validate URL
            if not is_valid_url(href, base_domain):
                continue
                
            # Check if it's a section link
            if any(pattern in href.lower() for pattern in section_patterns):
                section_links.add(href)
        except:
            continue
    
    return list(section_links)

def sort_links_by_relevance(links):
    # Scoring system for link relevance
    def get_link_score(url):
        score = 0
        if re.search(r'/\d{4}/\d{2}/\d{2}/', url): score += 5  # Date pattern
        if '/news/' in url.lower(): score += 4                  # News section
        if '/article/' in url.lower(): score += 4              # Article section
        if re.search(r'/[a-z0-9-]{20,}', url): score += 3     # Long slug
        return score
    
    return sorted(links, key=get_link_score, reverse=True)

# Check if the article is in English
def is_english_article(article_soup): 
    html_tag = article_soup.find('html')
    lang = html_tag.get('lang') if html_tag else None
    return not lang or lang.startswith('en')

# Function to check if the page has sufficient article content
def has_article_content(soup):
    # Look for article element or common article containers
    article_element = soup.find(['article', 'main', 'div'], class_=lambda c: c and any(x in str(c).lower() for x in ['article', 'story', 'content', 'post']))
    
    if not article_element:
        return False
    
    # Get the text content of the article element
    article_text = article_element.get_text(strip=True)
    
    # An article should have a reasonable amount of text
    # (typically at least 200 characters)
    return len(article_text) > 400


# Minimum required articles before continuing
MIN_ARTICLES = 10 

# List to store article links
all_article_links = []
all_articles_data = [] # Create an empty list to hold article data

# Iterate through each news source
for source_name, base_url in news_sources.items():
    try:
        print(f"\nProcessing source: {source_name}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Get the main page
        main_page = requests.get(base_url, timeout=15, headers=headers)
        if main_page.status_code != 200:
            print(f"Failed to access {source_name}: HTTP status code {main_page.status_code}")
            continue
        
        # Parsing the main page
        main_soup = BeautifulSoup(main_page.text, 'html.parser')
        visited_urls = set([base_url])



        article_links = extract_article_links(main_soup, base_url, visited_urls=visited_urls)
        
        # Keep trying until we have enough articles or have exhausted our options
        attempts = 0
        while len(article_links) < MIN_ARTICLES and attempts < 3:
            print(f"Found only {len(article_links)} articles, searching deeper...")
            new_links = []
            for link in article_links:
                try:
                    page = requests.get(link, timeout=15, headers=headers)
                    if page.status_code == 200:
                        soup = BeautifulSoup(page.text, 'html.parser')
                        new_links.extend(extract_article_links(soup, base_url, visited_urls=visited_urls))
                except Exception as e:
                    print(f"Error following link {link}: {e}")
            article_links.extend(new_links)
            article_links = list(set(article_links))  # Remove duplicates
            attempts += 1
            
        print(f"Found {len(article_links)} potential articles to process")
        
        # Add links to the all_article_links list
        all_article_links.extend(article_links)

        # Process each article
        for link in article_links:
            try:
                print(f"\nProcessing article: {link}")
                article_page = requests.get(link, timeout=15, headers=headers)
                
                if article_page.status_code == 200:
                    article_soup = BeautifulSoup(article_page.text, 'html.parser')
                    
                    # Check if the article is in English
                    if not is_english_article(article_soup):
                        print(f"Article is not in English, skipping")
                        continue
                    
                    # Check if this page has the characteristics of an article
                    if not has_article_content(article_soup):
                        print(f"Page does not appear to have enough content so therefore not an article, skipping")
                        continue

                    # Remove unwanted elements
                    for element in article_soup(["script", "style", "meta", "noscript", "header", "footer", "nav", "aside"]):
                        element.extract()
                    
                    # Try to find the article content
                    article_element = article_soup.find(['article', 'main', 'div'], class_=lambda c: c and any(x in str(c).lower() for x in ['article', 'story', 'content', 'post']))
                    
                    # Get the text content
                    if article_element:
                        text = article_element.get_text(separator=' ', strip=True)
                    else:
                        text = article_soup.get_text(separator=' ', strip=True)
                    
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    # If text is too short, it's likely not an article
                    if len(text) < 400:
                        print(f"Content too short ({len(text)} chars), likely not an article")
                        continue

                    # Append the article data to the list
                    article_data = {
                        "source": source_name,
                        "article_link": link,
                        "article_text": text,
                        "article_headline": article_soup.title.string
                    }
                    all_articles_data.append(article_data)
                    
                    # Print the article details
                    print(f"Source: {source_name}")
                    print(f"Article Headline: {article_soup.title.string}")
                    print(f"Article link: {link}")
                    print(f"Article length: {len(text)} characters")
                    print(f"Article text preview: {text[:100]}...") # Print just a preview

                    # Insert the article into Supabase
                    insert_news_sources(supabase, source_name, link, text, article_soup.title.string)

                else:
                    print(f"Failed to access article {link}: HTTP status code {article_page.status_code}")

                #time.sleep(2)  # Pause between article requests
                
                
            except Exception as e:
                print(f"Failed to scrape article {link}: {e}")
        
    except Exception as e:
        print(f"Failed to process source {source_name}: {e}")

print(f"\nScraping complete! Processed {len(all_articles_data)} articles.")

# Update the main processing loop to use ThreadPoolExecutor
def process_all_sources(news_sources):
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(process_news_source, source_name, url): source_name 
            for source_name, url in news_sources.items()
        }
        
        all_article_links = []
        for future in futures:
            source_name = futures[future]
            try:
                article_links = future.result()
                all_article_links.extend(article_links)
                print(f"Found {len(article_links)} articles from {source_name}")
            except Exception as e:
                print(f"Failed to process {source_name}: {str(e)}")
    
    return all_article_links

def process_news_source(source_name, base_url):
    """Process a single news source with better error handling"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(base_url, timeout=15, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        visited_urls = set([base_url])
        
        article_links = extract_article_links(soup, base_url, visited_urls=visited_urls)
        return article_links
        
    except Exception as e:
        print(f"Error processing {source_name}: {str(e)}")
        return []
