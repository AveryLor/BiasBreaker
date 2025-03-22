import os
from dotenv import load_dotenv
from supabase import create_client
import json
import sys

# Load environment variables
load_dotenv()

def initialize_db():
    """Initialize the database tables in Supabase."""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        sys.exit(1)
    
    # Connect to Supabase
    client = create_client(supabase_url, supabase_key)
    
    table_prefix = "news_test_"
    
    # SQL scripts to create tables - for manual execution in Supabase SQL Editor
    sql_scripts = f"""
-- Create articles table
CREATE TABLE IF NOT EXISTS {table_prefix}articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS {table_prefix}analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    result JSONB NOT NULL,
    module TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS {table_prefix}user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    emphasis_level INTEGER NOT NULL DEFAULT 5,
    focus_groups JSONB DEFAULT '[]'::jsonb,
    tone TEXT DEFAULT 'balanced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create synthesized_articles table
CREATE TABLE IF NOT EXISTS {table_prefix}synthesized_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""
    
    print("==== SQL STATEMENTS FOR MANUAL EXECUTION IN SUPABASE SQL EDITOR ====")
    print(sql_scripts)
    print("====================================================================")
    print("\nPlease copy the SQL statements above and execute them in the Supabase SQL Editor")
    print("After creating the tables, run this script again to insert sample data")
    
    # Check if tables already exist
    try:
        # Try to select from articles table
        response = client.table(f"{table_prefix}articles").select("id").limit(1).execute()
        print(f"Table {table_prefix}articles exists, proceeding with data insertion")
        
        # Insert sample data
        print("Inserting sample articles...")
        
        # Sample data for articles
        sample_articles = [
            {
                "title": "Economic Impact of Climate Change Policies",
                "content": """
                The implementation of carbon taxes and emission trading schemes continues to be
                debated among economists and policymakers. Proponents argue these measures will drive
                innovation in clean energy technologies and create new jobs, while critics contend they
                will harm economic growth and disproportionately impact certain industries.
                
                Recent studies from major economic institutions suggest that well-designed climate policies
                can achieve emission reductions without significant harm to overall economic output. 
                However, the distribution of impacts across sectors remains a key concern.
                
                Meanwhile, environmental advocates push for more immediate action, citing the escalating costs
                of climate-related disasters. Industry representatives have called for a gradual approach
                to implementation, allowing businesses more time to adapt.
                """,
                "source": "Example News Source"
            },
            {
                "title": "Tech Innovation in Healthcare Delivery",
                "content": """
                Healthcare providers are increasingly adopting artificial intelligence and machine learning
                solutions to enhance patient care and streamline operations. From diagnostic tools to
                personalized treatment plans, technology is transforming how healthcare is delivered.
                
                While these innovations promise greater efficiency and potentially better outcomes, 
                concerns about privacy, algorithm bias, and the digital divide persist. Critics warn
                that overreliance on technology could exacerbate existing healthcare inequities.
                
                Medical professionals emphasize the importance of maintaining the human element in care,
                viewing technology as an enhancement rather than a replacement for provider judgment.
                Patient advocacy groups call for greater transparency in how algorithms make decisions
                and handle sensitive health information.
                """,
                "source": "Example Health Journal"
            }
        ]
        
        # Insert sample articles
        for article in sample_articles:
            # Check if article already exists
            response = client.table(f"{table_prefix}articles").select("*").eq("title", article["title"]).execute()
            if len(response.data) == 0:
                client.table(f"{table_prefix}articles").insert(article).execute()
                print(f"Added article: {article['title']}")
            else:
                print(f"Article already exists: {article['title']}")
        
        # Insert sample user settings
        sample_user_settings = {
            "user_id": "test_user_1",
            "emphasis_level": 7,
            "focus_groups": json.dumps(["women", "ethnic minorities", "rural communities"]),
            "tone": "balanced"
        }
        
        # Check if user settings already exist
        response = client.table(f"{table_prefix}user_settings").select("*").eq("user_id", sample_user_settings["user_id"]).execute()
        if len(response.data) == 0:
            client.table(f"{table_prefix}user_settings").insert(sample_user_settings).execute()
            print(f"Added user settings for user: {sample_user_settings['user_id']}")
        else:
            print(f"User settings already exist for: {sample_user_settings['user_id']}")
        
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Table {table_prefix}articles does not exist yet. Please create the tables first.")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    initialize_db() 