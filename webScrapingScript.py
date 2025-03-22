from bs4 import BeautifulSoup
import requests
import time
import re

# URL of the Wikipedia page
url = 'https://en.wikipedia.org/wiki/Wikipedia:Reliable_sources/Perennial_sources'
page = requests.get(url)
soup = BeautifulSoup(page.text, 'html.parser')

# Find the table with the "Perennial sources" id
tables = soup.find_all('table', {'class': 'wikitable'})
target_table = None

for table in tables:
    if table.find('caption') and 'Perennial sources' in table.find('caption').get_text():
        target_table = table
        break

# If we can't find by caption, try to find the table by checking its content
if not target_table:
    for table in tables:
        if table.find(text=re.compile('Source')) and table.find(text=re.compile('Status')):
            target_table = table
            break

# Extract all external links from the table
links = []
if target_table:
    for row in target_table.find_all('tr')[1:]:  # Skip header row
        cells = row.find_all('td')
        if cells:
            source_cell = cells[0]  # First column contains the source name and links
            for a_tag in source_cell.find_all('a', href=True):
                href = a_tag['href']
                # Check if it's an external link or needs to be converted from a Wikipedia link
                if href.startswith('http'):
                    links.append(href)
                elif href.startswith('/wiki/') and ':' not in href:
                    # It's a Wikipedia article, convert to full URL
                    links.append(f"https://en.wikipedia.org{href}")

# Remove duplicates while preserving order
unique_links = []
for link in links:
    if link not in unique_links:
        unique_links.append(link)

print(f"Found {len(unique_links)} unique links to process\n")

# Iterate over each link and scrape the text content
for link in unique_links:
    try:
        print(f"Processing: {link}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        page = requests.get(link, timeout=15, headers=headers)  # Increased timeout for larger pages
        
        if page.status_code == 200:
            soup = BeautifulSoup(page.text, 'html.parser')

            # Extract website name
            website_name = link.split("//")[-1].split("/")[0]  # Extract domain name

            # Remove script and style elements that contain JavaScript/CSS
            for script in soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                script.extract()
                
            # Get the complete text from the entire page
            text = soup.get_text(separator=' ', strip=True)
            
            # Clean up excessive whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            # Print in the requested format
            print(f"Website name: {website_name}")
            print(f"Website link: {link}")
            print(f"Website text blurb: {text}")
            print("\n")
        else:
            print(f"Failed to access {link}: HTTP status code {page.status_code}\n")

        time.sleep(2)  # Pause between requests to be considerate to servers
    except Exception as e:
        print(f"Failed to scrape {link}: {e}\n")