# GenesisAI
Genesis AI Hackathon

## Architecture

### Backend Structure

The application uses a FastAPI backend server that:
1. Connects to the Supabase database
2. Provides RESTful endpoints for accessing news articles
3. Handles analysis and processing of queries

### API Modules

The API modules (e.g., `natural_language_understanding.py`) now communicate with the FastAPI backend via HTTP requests:
- They do not directly access the database
- They use the FastAPI backend as a gateway to the database
- This ensures a clean separation of concerns

### Architecture Changes

**Previous Implementation:**
- API modules directly accessed the Supabase database through a `Database` class.
- This created tight coupling between the API modules and the database.

**New Implementation:**
- API modules now communicate with the FastAPI backend server via HTTP requests.
- The FastAPI backend acts as a gateway to the database.
- This creates a clean separation of concerns and follows RESTful principles.

**Benefits:**
1. Separation of concerns - API modules don't need to know database details
2. Single source of truth - Only the FastAPI backend connects to the database 
3. Testability - API modules can be tested with mock responses
4. Scalability - FastAPI backend can be scaled independently

**Added Functionality:**
- Robust error handling when the backend is not available
- Fallback to mock data when the database can't provide real articles
- Detailed error logging to help diagnose issues

### Setup

1. Start the FastAPI backend server:
```bash
python backend/main.py
```

2. The API modules will automatically connect to the backend server running at the URL specified in the `BACKEND_URL` environment variable (defaults to `http://localhost:8000`)

3. To test the Natural Language Understanding module:
```bash
python test_nlu_api.py
```

### Environment Variables

Set these in your `.env` file:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase API key
- `COHERE_API_KEY`: Your Cohere API key
- `BACKEND_URL`: URL of the FastAPI backend (default: http://localhost:8000)

### Testing

To test this implementation, make sure the FastAPI backend is running:

```bash
cd backend
python main.py
```

Then run the test script in another terminal:

```bash
python test_nlu_api.py
```

### Database Search Implementation

The application now uses a dedicated approach to search articles in the database:

1. **Table Structure**:
   - The Supabase database contains a table named "news"
   - Key columns: id, source_name, source_link, news_information

2. **Search Functionality**:
   - A new `/search` endpoint that specifically searches the news_information column
   - Enhanced keyword matching in the NLU module
   - Fallback mechanisms when search fails

3. **Improvements**:
   - Direct searching in the news_information column for better relevance
   - Multiple search strategies with progressive fallbacks
   - Robust error handling and logging
   - Mock data fallback for testing when the database is unavailable

### Testing The Implementation

To test the search functionality:

1. Start the FastAPI backend:
   ```bash
   cd backend
   python main.py
   ```

2. Use the test script to search for specific terms:
   ```bash
   python test_search.py "search term"
   ```

3. Or use the full NLU pipeline:
   ```bash
   python test_nlu_api.py
   ```
