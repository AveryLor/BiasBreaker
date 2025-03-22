from bs4 import BeautifulSoup
from supabase import create_client, Client
import requests
import time
import re
import csv
import json
import sys

# Your Supabae credentials 
SUPABASE_URL = 'https://jexfgqihwnhyehxwxmeq.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGZncWlod25oeWVoeHd4bWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NjMxOTUsImV4cCI6MjA1ODIzOTE5NX0.H4Wh-b3cqxBH-srLTFxYBriY6XuhKj1ZhjFCOfaqWI4'

# Initialize Supbase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Redirect stdout to a file 
log_file = "scraping_log.txt"
sys.stdout = open(log_file, "w")

# List of news sources with their URLs
news_sources = {
    'CBC News': 'https://www.cbc.ca/',

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
        
        # Insert the data into the 'news_sources' table
        response = supabase.table('news_sources').insert(data).execute()
        
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

# Function to extract article links from a page
def extract_article_links(soup, base_url):
    links = []
    # Look for common article link patterns
    article_tags = soup.find_all('a', href=True)
    
    # For each article link extract hte url
    for tag in article_tags:
        href = tag['href']

        # Normalize the URL
        if href.startswith('//'): 
            href = 'https:' + href
        elif href.startswith('/'):
            href = base_url.rstrip('/') + href
        elif not href.startswith(('http://', 'https://')):
            continue
            
        # Skip non-article links (common patterns)
        if any(skip in href.lower() for skip in [
            '/tag/', '/category/', '/author/', '/about/', 
            '/contact/', '/advertise/', '/subscribe/',
            'javascript:', 'mailto:', '#'
        ]): 
            continue
            
        if href not in links:
            links.append(href)
    
    return links[:10]  # Return only top 10 links

# Is the article in English
def is_english_article(article_soup): 
    html_tag = article_soup.find('html')
    lang = html_tag.get('lang') if html_tag else None
    return lang == 'en'

# Iterate through each news source
for source_name, base_url in news_sources.items():
    try:
        print(f"\nProcessing source: {source_name}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Get the main page
        main_page = requests.get(base_url, timeout=15, headers=headers) # Sending a request to website, timing out if it doesn't work
        if main_page.status_code != 200:
            print(f"Failed to access {source_name}: HTTP status code {main_page.status_code}")
            continue
        
        # Parsing the main page
        main_soup = BeautifulSoup(main_page.text, 'html.parser')
        article_links = extract_article_links(main_soup, base_url)
        print(f"Found {len(article_links)} articles to process")
        
        # Add links to the all_article_links list
        all_article_links.extend(article_links)

        # Process each article
        for link in article_links:
            try:
                print(f"\nProcessing article: {link}")
                article_page = requests.get(link, timeout=15, headers=headers)
                
                if article_page.status_code == 200:
                    article_soup = BeautifulSoup(article_page.text, 'html.parser')
                    
                    #check if the article is in English
                    if not is_english_article(article_soup):
                        print(f"Article is not in English, skipping")
                        continue

                    # Remove unwanted elements
                    for element in article_soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                        element.extract()
                    
                    # Get the text content
                    text = article_soup.get_text(separator=' ', strip=True)
                    text = re.sub(r'\s+', ' ', text).strip()

                    # Insert the article into Supabase
                    insert_news_sources(supabase, source_name, link, text)

                    # Append the article data to the list
                    article_data = {
                        "source": source_name,
                        "article_link": link,
                        "article_text": text[:]  # Save the first 500 characters of text
                    }
                    all_articles_data.append(article_data)
                    
                    # Print the article details
                else:
                    print(f"Failed to access article {link}: HTTP status code {article_page.status_code}")
                
                time.sleep(2)  # Pause between article requests
                
            except Exception as e:
                print(f"Failed to scrape article {link}: {e}")
        
    except Exception as e:
        print(f"Failed to process source {source_name}: {e}")


csv_file = "article _links.csv"
with open(csv_file, mode="w", newline='', encoding='utf-8') as file: 
    writer = csv.writer(file)
    writer.writerow(["Source", "ArticleLink"])
    for source_name in news_sources.keys():
        for link in all_article_links: 
            writer.writerow([source_name, link])

print(f"\nAll article links hae been saved to {csv_file}")

# Save all articles to a JSON file
with open('articles.json', 'w', encoding='utf-8') as json_file:
    json.dump(all_articles_data, json_file, ensure_ascii=False, indent=4)

print(f"\nSaved {len(all_articles_data)} articles to articles.json")

















# Script for writing to a file

# Open a file to write the details
with open("article_details.txt", mode="w", encoding="utf-8") as file:
    # Iterate through each article and write its details
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

                # Remove unwanted elements
                for element in article_soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                    element.extract()

                # Get the text content
                text = article_soup.get_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text).strip()

                # Insert the article into Supabase
                insert_news_sources(supabase, source_name, link, text)

                # Append the article data to the list
                article_data = {
                    "source": source_name,
                    "article_link": link,
                    "article_text": text[:]  # Save the first 500 characters of text
                }
                all_articles_data.append(article_data)
                
                # Write the article details to the file
                file.write(f"Source: {source_name}\n")
                file.write(f"Article link: {link}\n")
                file.write(f"Article text preview: {text[:]}\n")
                file.write("\n" + "-"*80 + "\n")  # Add a separator between articles

                print(f"Source: {source_name}")
                print(f"Article link: {link}")
                print(f"Article text preview: {text[:]}") # -> Printing off all characters
                
            else:
                print(f"Failed to access article {link}: HTTP status code {article_page.status_code}")
            
            time.sleep(2)  # Pause between article requests
            
        except Exception as e:
            print(f"Failed to scrape article {link}: {e}")
