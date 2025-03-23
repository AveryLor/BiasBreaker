#!/usr/bin/env python
import os
import sys
import importlib.util
import subprocess

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print a formatted header for the testing suite."""
    print("="*60)
    print("             GenesisAI API Testing Suite")
    print("="*60)
    print()

def print_menu():
    """Print the main menu options."""
    print("Available modules to test:")
    print()
    print("1. Natural Language Understanding")
    print("2. Generative News Synthesis")
    print("3. Underrepresented Voices")
    print("4. DEI Focus")
    print("5. User Customization")
    print("6. Neutrality Check")
    print()
    print("0. Exit")
    print()

def run_module(module_name):
    """Run the specified test module."""
    script_path = os.path.join(os.path.dirname(__file__), f"test_{module_name}.py")
    
    if not os.path.exists(script_path):
        print(f"Error: Test script {script_path} not found.")
        return False
    
    try:
        subprocess.run([sys.executable, script_path], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running test: {e}")
        return False

def check_database():
    """Check if database connection can be established."""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from database import Database
        
        # Try to initialize the database connection
        db = Database()
        # Test fetching articles to verify connection
        articles = db.fetch_articles(limit=1)
        
        if articles is not None:
            return True
        return False
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return False

def main():
    """Main function to run the testing suite."""
    # Add parent directory to sys.path for imports
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    
    # Check if API modules can be imported
    try:
        from natural_language_understanding import NaturalLanguageUnderstanding
        from generative_news_synthesis import GenerativeNewsSynthesis
        from underrepresented_voices import UnderrepresentedVoices
        from dei_focus import DEIFocus
        from user_customization import UserCustomization
        from neutrality_check import NeutralityCheck
        print("API modules successfully imported.")
    except ImportError as e:
        print(f"Warning: Could not import API modules: {e}")
        print("Some tests may fail if modules are not properly installed.")
    
    # Check database connection
    db_connected = check_database()
    
    while True:
        clear_screen()
        print_header()
        
        # Display database status
        if db_connected:
            print("✅ Database connection: ESTABLISHED")
        else:
            print("❌ Database connection: FAILED - Some features may be limited")
        print("Tests will use sample data if database connection fails.\n")
        
        print_menu()
        
        choice = input("Enter your choice (0-6): ")
        
        if choice == "0":
            clear_screen()
            print("Exiting testing suite. Goodbye!")
            break
        
        module_map = {
            "1": "natural_language_understanding",
            "2": "generative_news_synthesis",
            "3": "underrepresented_voices",
            "4": "dei_focus",
            "5": "user_customization",
            "6": "neutrality_check"
        }
        
        if choice in module_map:
            clear_screen()
            print(f"Running test for {module_map[choice].replace('_', ' ').title()}...")
            print()
            
            success = run_module(module_map[choice])
            
            if success:
                print("\nTest completed successfully.")
            else:
                print("\nTest encountered errors.")
                
            input("\nPress Enter to return to the main menu...")
        else:
            print("Invalid choice. Please try again.")
            input("Press Enter to continue...")

if __name__ == "__main__":
    main() 