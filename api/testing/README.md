# GenesisAI API Testing Suite

This folder contains test scripts for each module in the GenesisAI API.

## Prerequisites

- Python 3.8+
- All required dependencies installed (cohere, dotenv, etc.)
- Cohere API key set in your .env file

## Quick Start

The easiest way to run all tests is to use the main test script:

```bash
python test_all.py
```

This will display a menu allowing you to select which module to test.

## API Module Structure

Each API module is implemented as a class with the following structure:

- **NaturalLanguageUnderstanding** - Analyzes user queries using natural language understanding
- **GenerativeNewsSynthesis** - Synthesizes multiple articles into a cohesive narrative
- **UnderrepresentedVoices** - Identifies missing perspectives in news articles
- **DEIFocus** - Enhances content to emphasize diversity, equity, and inclusion
- **UserCustomization** - Customizes article emphasis based on user preferences
- **NeutralityCheck** - Evaluates articles for political bias and neutrality

## Individual Module Testing

You can also run each test script individually with various command-line options:

### Natural Language Understanding

```bash
python test_natural_language_understanding.py --query "What are the latest developments in AI?"
```

### Generative News Synthesis

```bash
# Run with sample articles
python test_generative_news_synthesis.py

# Run with custom articles
python test_generative_news_synthesis.py --articles "Title 1:Content 1" "Title 2:Content 2"

# Run with articles from a JSON file
python test_generative_news_synthesis.py --file articles.json
```

### Underrepresented Voices

```bash
# Run with sample article
python test_underrepresented_voices.py

# Run with custom article
python test_underrepresented_voices.py --title "Article Title" --body "Article content here..."

# Run with article from a JSON file
python test_underrepresented_voices.py --file article.json
```

### DEI Focus

```bash
# Run with sample data
python test_dei_focus.py

# Run with data from a JSON file
python test_dei_focus.py --file article_with_voices.json
```

### User Customization

```bash
# Run with sample data
python test_user_customization.py

# Run with custom settings
python test_user_customization.py --emphasis-level 8 --focus-groups "Women" "Indigenous communities"

# Run with article file and settings file
python test_user_customization.py --article-file article.json --settings-file settings.json
```

### Neutrality Check

```bash
# Run with sample article
python test_neutrality_check.py

# Run with custom article
python test_neutrality_check.py --title "Article Title" --content "Article content here..."

# Run with article from a JSON file
python test_neutrality_check.py --file article.json
```

## File Formats

When using `--file` options, the JSON files should match the expected structure for each module.

### Example article.json for Neutrality Check

```json
{
  "customized_article": {
    "title": "Economic Policies Debate",
    "content": "Article content here..."
  }
}
```

### Example article_with_voices.json for DEI Focus

```json
{
  "main_article": {
    "title": "Global Economic Trends",
    "body": "Article content here..."
  },
  "underrepresented": {
    "segments": [
      "Segment of text with underrepresented voice",
      "Another segment with underrepresented perspective"
    ],
    "demographics": [
      "Women business owners",
      "Indigenous communities"
    ]
  }
}
```

## Troubleshooting

- Ensure your Cohere API key is set correctly in the .env file
- Check for any errors in the terminal output
- Make sure all dependencies are installed 