from bs4 import BeautifulSoup
from supabase import create_client, Client
import requests
import time
import re
import csv
import json
import sys

# Your Supabase credentials 
SUPABASE_URL = 'https://jexfgqihwnhyehxwxmeq.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGZncWlod25oeWVoeHd4bWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NjMxOTUsImV4cCI6MjA1ODIzOTE5NX0.H4Wh-b3cqxBH-srLTFxYBriY6XuhKj1ZhjFCOfaqWI4'

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of news sources with their URLs
news_sources = {
    'CBC News': 'https://www.cbc.ca/',
   'CTV News': 'https://www.ctvnews.ca/',
   'Global News': 'https://globalnews.ca/',
   'Toronto Star': 'https://www.thestar.com/',
   'National Post': 'https://nationalpost.com/',
   'The Globe and Mail': 'https://www.theglobeandmail.com/',
   'Ottawa Citizen': 'https://ottawacitizen.com/',
   'Calgary Herald': 'https://calgaryherald.com/',
   'Vancouver Sun': 'https://www.vancouversun.com/',
   'Montreal Gazette': 'https://montrealgazette.com/',
   'CNN': 'https://www.cnn.com/',
   'Fox News': 'https://www.foxnews.com/',
   'MSNBC': 'https://www.msnbc.com/',
   'The New York Times': 'https://www.nytimes.com/',
   'The Washington Post': 'https://www.washingtonpost.com/',
   'Wall Street Journal': 'https://www.wsj.com/',
   'Breitbart News': 'https://www.breitbart.com/',
   'The Hill': 'https://thehill.com/',
   'Politico': 'https://www.politico.com/',
   'USA Today': 'https://www.usatoday.com/',
   'New York Post': 'https://nypost.com/',
   'NPR': 'https://www.npr.org/',
   'The Atlantic': 'https://www.theatlantic.com/',
   'Newsmax': 'https://www.newsmax.com/',
   'Los Angeles Times': 'https://www.latimes.com/',
   'News24': 'https://www.news24.com/',
   'Punch': 'https://punchng.com/',
   'Daily Nation': 'https://www.nation.co.ke/',
   'Times of India': 'https://timesofindia.indiatimes.com/',
   'Dawn': 'https://www.dawn.com/',
   'The Japan Times': 'https://www.japantimes.co.jp/',
   'The Straits Times': 'https://www.straitstimes.com/',
   'BBC News': 'https://www.bbc.com/news/',
   'Der Spiegel': 'https://www.spiegel.de/international/',
   'France24': 'https://www.france24.com/en/',
   'Spain News': 'https://www.spainnews.net/',
   'Ansa': 'https://www.ansa.it/english/',
   'ABC News Australia': 'https://www.abc.net.au/news/',
   'Stuff': 'https://www.stuff.co.nz/',
   'Riot Times': 'https://riotimesonline.com/',
   'BA Times': 'https://www.batimes.com.ar/',
   'Santiago Times': 'https://santiagotimes.cl/',
   'Xinhua News': 'https://english.news.cn/',
   'Arab News': 'https://www.arabnews.com/',
   'Hurriyet Daily News': 'https://www.hurriyetdailynews.com/',
   'Tehran Times': 'https://www.tehrantimes.com/',
   'Mexico News Daily': 'https://mexiconewsdaily.com/',
   'Krakow Post': 'https://www.krakowpost.com/',
   'Daily Monitor': 'https://www.monitor.co.ug/',
   'Romania Insider': 'https://www.romania-insider.com/'
}

# Function to insert news sources into Supabase
def insert_news_sources(supabase, source_name, source_link, news_information):
    try:
        # Create a dictionary with the data to insert
        data = {
            'source_name': source_name,
            'source_link': source_link,
            'news_information': news_information
        }
        
        # Insert the data into the 'news' table
        response = supabase.table('news').insert(data).execute()
        
        if response.data:
            print(f"Successfully inserted article from {source_name}")
        else:
            print(f"Failed to insert article from {source_name}")
    
    except Exception as e:
        print(f"Failed to insert article from {source_name}: {e}")

print(f"Processing {len(news_sources)} news sources\n")

# List to store article links
all_article_links = []
all_articles_data = [] # Create an empty list to hold article data

# Function to determine if URL is likely an article
def is_likely_article(url, base_domain):
    # Skip common non-article sections
    non_article_patterns = [
        '/television', '/listen', '/radio', '/music', '/sports',
        '/about', '/contact', '/help', '/faq', '/advertise', '/subscribe',
        '/weather', '/video', '/live', '/podcasts', '/player',
        '/account', '/login', '/register', '/signup', '/profile',
        '/search', '/terms', '/privacy', '/sitemap', '/rss',
        '/shows', '/schedule', '/listings', '/program'
    ]
    
    # Non-article file extensions
    non_article_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.mp3', '.mp4', '.avi']
    
    # Skip URLs that contain these common non-article patterns
    for pattern in non_article_patterns:
        if pattern in url.lower():
            return False
    
    # Skip URLs with non-article file extensions
    if any(url.lower().endswith(ext) for ext in non_article_extensions):
        return False
    
    # Skip homepage and major section pages (usually short URLs)
    if url.replace('http://', '').replace('https://', '').replace(base_domain, '').count('/') <= 1:
        return False
    
    # URLs with date patterns are likely articles
    date_patterns = [
        r'/\d{4}/\d{2}/\d{2}/',  # /yyyy/mm/dd/
        r'/\d{4}-\d{2}-\d{2}/',  # /yyyy-mm-dd/
        r'/news/[a-z\-0-9]+/',   # /news/article-slug/
        r'/article/'            # /article/
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, url.lower()):
            return True
    
    # CBC News specific patterns that typically indicate articles
    article_patterns = [
        r'/news/',
        r'/politics/',
        r'/business/',
        r'/health/',
        r'/technology/'
    ]
    
    for pattern in article_patterns:
        if re.search(pattern, url.lower()):
            return True
    
    return True  # Default to accepting URLs that passed the filters

# Function to extract article links from a page
def extract_article_links(soup, base_url):
    links = []
    base_domain = base_url.split('//')[1].split('/')[0]
    
    # Look for common article link patterns
    article_tags = soup.find_all('a', href=True)
    
    # For each article link extract the url
    for tag in article_tags:
        href = tag['href']

        # Normalize the URL
        if href.startswith('//'): 
            href = 'https:' + href
        elif href.startswith('/'):
            href = base_url.rstrip('/') + href
        elif not href.startswith(('http://', 'https://')):
            continue
        
        # Skip URLs that aren't on the same domain
        if base_domain not in href:
            continue
        
        # Skip non-article links (common patterns)
        if any(skip in href.lower() for skip in [
            '/tag/', '/category/', '/author/',
            'javascript:', 'mailto:', '#'
        ]): 
            continue
        
        # Check if this URL is likely an article
        if is_likely_article(href, base_domain):
            if href not in links:
                links.append(href)
    
    # Return only unique links that likely point to articles
    return links[:10]  # Return only top 10 links

# Is the article in English
def is_english_article(article_soup): 
    html_tag = article_soup.find('html')
    lang = html_tag.get('lang') if html_tag else None
    
    # If lang attribute exists and is explicitly non-English, return False
    if lang and lang.startswith('en') is False:
        return False
        
    # Additional check: Look for common English words in title or meta description
    title = article_soup.find('title')
    title_text = title.get_text() if title else ""
    
    meta_desc = article_soup.find('meta', attrs={'name': 'description'})
    desc_text = meta_desc.get('content', "") if meta_desc else ""
    
    combined_text = (title_text + " " + desc_text).lower()
    english_indicators = ['the', 'and', 'news', 'in', 'on', 'at', 'for', 'with', 'by']
    
    # Count how many English indicator words are present
    english_word_count = sum(1 for word in english_indicators if word in combined_text.split())
    
    # If we found at least 2 English indicators, assume it's English
    return english_word_count >= 2

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
    return len(article_text) > 200

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
        article_links = extract_article_links(main_soup, base_url)
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
                        print(f"Page does not appear to be an article, skipping")
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
                    if len(text) < 1000:
                        print(f"Content too short ({len(text)} chars), likely not an article")
                        continue

                    # Append the article data to the list
                    article_data = {
                        "source": source_name,
                        "article_link": link,
                        "article_text": text
                    }
                    all_articles_data.append(article_data)
                    
                    # Print the article details
                    print(f"Source: {source_name}")
                    print(f"Article link: {link}")
                    print(f"Article length: {len(text)} characters")
                    print(f"Article text preview: {text[:]}...") # Print just a preview

                    # Insert the article into Supabase
                    insert_news_sources(supabase, source_name, link, text)

                else:
                    print(f"Failed to access article {link}: HTTP status code {article_page.status_code}")
                
                time.sleep(2)  # Pause between article requests
                
            except Exception as e:
                print(f"Failed to scrape article {link}: {e}")
        
    except Exception as e:
        print(f"Failed to process source {source_name}: {e}")

print(f"\nScraping complete! Processed {len(all_articles_data)} articles.")
