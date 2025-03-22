#!/usr/bin/env python
import os
import sys
import json
import argparse

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import the module to test
from user_customization import UserCustomization

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test User Customization API')
    
    parser.add_argument('--emphasis-level', type=int, choices=range(1, 11),
                       help='Emphasis level for underrepresented voices (1-10)')
    parser.add_argument('--focus-groups', nargs='+',
                       help='Specific groups to focus on (space-separated)')
    
    parser.add_argument('--article-file', type=str,
                       help='JSON file containing article data with DEI emphasis')
    parser.add_argument('--settings-file', type=str,
                       help='JSON file containing user settings')
    
    return parser.parse_args()

def display_results(article_data, settings, result):
    """Display the original article, settings, and customized article."""
    print("\n" + "="*80)
    print("USER CUSTOMIZATION RESULTS")
    print("="*80)
    
    # Display original article
    if 'updated_article' in article_data:
        print("\nORIGINAL ARTICLE:")
        print("-" * 80)
        print(f"TITLE: {article_data['updated_article']['title']}")
        print("-" * 40)
        print(article_data['updated_article']['content'][:500] + "..." if len(article_data['updated_article']['content']) > 500 else article_data['updated_article']['content'])
    
    # Display DEI section if available
    if 'dei_section' in article_data:
        print("\nDEI SECTION:")
        print("-" * 80)
        print(article_data['dei_section'])
    
    # Display user settings
    print("\nUSER SETTINGS:")
    print("-" * 80)
    for key, value in settings.items():
        if isinstance(value, list):
            print(f"{key}: {', '.join(value)}")
        else:
            print(f"{key}: {value}")
    
    # Display customized article
    if 'customized_article' in result:
        print("\nCUSTOMIZED ARTICLE:")
        print("-" * 80)
        print(f"TITLE: {result['customized_article']['title']}")
        print("-" * 40)
        print(result['customized_article']['content'][:500] + "..." if len(result['customized_article']['content']) > 500 else result['customized_article']['content'])
    
    # Display customized DEI section if available
    if 'customized_dei_section' in result:
        print("\nCUSTOMIZED DEI SECTION:")
        print("-" * 80)
        print(result['customized_dei_section'])
    
    print("\n" + "="*80)

def load_sample_article_data():
    """Load sample article data for testing."""
    return {
        "updated_article": {
            "title": "Economic Disparities Persist Across Global Markets",
            "content": """
            The global economy showed varied performance metrics across regions and demographics last quarter.
            While Western economies maintained growth, developing nations encountered significant challenges.
            Women-led businesses in Southeast Asia demonstrated strong performance despite funding difficulties.
            Indigenous communities continue to advocate for infrastructure development to enable economic participation.
            Experts have highlighted concerns about growing wealth inequality despite market gains.
            """
        },
        "dei_section": """
        This article highlights several key DEI issues in global economics:
        
        1. The funding gap faced by women-led businesses despite their strong performance
        2. Infrastructure challenges disproportionately affecting indigenous communities
        3. Systemic barriers to economic development in developing nations
        4. Wealth inequality undermining inclusive economic growth
        
        These perspectives are critical to understanding the full economic picture beyond traditional metrics.
        """
    }

def load_sample_settings():
    """Load sample user settings for testing."""
    return {
        "emphasis_level": 7,
        "focus_groups": ["Women business owners", "Indigenous communities"],
        "tone": "academic"
    }

def load_from_file(file_path):
    """Load data from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading from file {file_path}: {str(e)}")
        return None

def main():
    """Main function to test the user customization API."""
    args = parse_arguments()
    
    # Load article data
    if args.article_file:
        article_data = load_from_file(args.article_file)
        if not article_data:
            print("Error: Could not load article data from file.")
            sys.exit(1)
    else:
        article_data = load_sample_article_data()
    
    # Load or create settings
    if args.settings_file:
        settings = load_from_file(args.settings_file)
        if not settings:
            print("Error: Could not load settings from file.")
            sys.exit(1)
    else:
        settings = load_sample_settings()
        
        # Override with command line arguments if provided
        if args.emphasis_level is not None:
            settings["emphasis_level"] = args.emphasis_level
        if args.focus_groups:
            settings["focus_groups"] = args.focus_groups
    
    print(f"\nCustomizing article based on user preferences...")
    print(f"Emphasis Level: {settings['emphasis_level']}")
    print(f"Focus Groups: {', '.join(settings['focus_groups'])}")
    print("\nProcessing... (this may take a moment)")
    
    try:
        # Initialize the API class
        customizer = UserCustomization()
        
        # Call the API function
        result = customizer.customize_dei_emphasis(article_data, settings)
        
        # Display the results
        display_results(article_data, settings, result)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 