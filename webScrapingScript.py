from bs4 import BeautifulSoup
import requests
import time
import re
import csv

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


print(f"Processing {len(news_sources)} news sources\n")

# List to store article links
all_article_links = []

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
                    
                    # Remove unwanted elements
                    for element in article_soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                        element.extract()
                    
                    # Get the text content
                    text = article_soup.get_text(separator=' ', strip=True)
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    print(f"Source: {source_name}")
                    print(f"Article link: {link}")
                    print(f"Article text preview: {text[:]}")  # Print first 500 characters
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