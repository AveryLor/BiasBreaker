import { Article, MergedArticle } from '@/data/dummyData';

export interface BiasGroup {
    score: number;
    label: string;
}

// Interface for the backend article response
export interface BackendArticle {
    id: string;
    title: string;
    content: string;
    source_link?: string;
    bias_score: number;
    biased_segments?: string[];
    summary?: string[];
}

// Interface for the neutral article response
export interface NeutralArticle {
    id: string;
    title: string;
    content: string;
    source_articles?: {
        id: string;
        title: string;
        bias_score: number;
        source_link?: string;
        summary?: string[];
    }[];
    source_count?: number;
    source_bias_range?: string;
}

// Interface for the chat response
export interface ChatResponse {
    status: string;
    message: string;
    query: string;
    keywords: string[];
    keyword_analysis: {
        query_main_words: string[];
        matching_keywords: string[];
        match_percentage: number;
    };
    results: BackendArticle[];
    neutral_article: NeutralArticle | null;
    sources?: {
        count: number;
        bias_range: string;
        articles: BackendArticle[];
    };
}

// Function to map bias scores to bias groups
export const mapBiasToGroup = (score: number): BiasGroup => {
    if (score >= 0 && score <= 20) {
        return { score, label: 'Liberals' };
    } else if (score > 20 && score <= 40) {
        return { score, label: 'Social Democrats' };
    } else if (score > 40 && score <= 60) {
        return { score, label: 'Centrist or Objective' };
    } else if (score > 60 && score <= 80) {
        return { score, label: 'Classical Liberals' };
    } else {
        return { score, label: 'Conservatives' };
    }
};

// Function to get a color based on bias group
export const getBiasColor = (score: number): string => {
    const { label } = mapBiasToGroup(score);

    switch (label) {
        case 'Liberals':
            return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
        case 'Social Democrats':
            return 'bg-purple-900/50 text-purple-300 border border-purple-700/60';
        case 'Centrist or Objective':
            return 'bg-green-900/50 text-green-300 border border-green-700/60';
        case 'Classical Liberals':
            return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/60';
        case 'Conservatives':
            return 'bg-red-900/50 text-red-300 border border-red-700/60';
        default:
            return 'bg-gray-800/50 text-gray-300 border border-gray-700/60';
    }
};

// Function to convert backend article to frontend article format
export const convertToFrontendArticle = (backendArticle: BackendArticle): Article => {
    const biasGroup = mapBiasToGroup(backendArticle.bias_score);

    return {
        id: parseInt(backendArticle.id) || Math.floor(Math.random() * 1000),
        source: backendArticle.source_link?.split('/')[2]?.replace('www.', '') || 'Unknown Source',
        title: backendArticle.title,
        excerpt: backendArticle.summary?.join(' ') || backendArticle.content.substring(0, 150) + '...',
        perspective: biasGroup.label as any, // TypeScript cast
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        url: backendArticle.source_link || '#',
        biasScore: backendArticle.bias_score,
        content: backendArticle.content
    };
};

// Function to convert backend neutral article to frontend merged article format
export const convertToMergedArticle = (neutralArticle: NeutralArticle): MergedArticle => {
    return {
        title: neutralArticle.title,
        summary: neutralArticle.content,
        sourcesConsidered: neutralArticle.source_articles?.map(article =>
            article.source_link?.split('/')[2]?.replace('www.', '') || article.title
        ) || [],
        sourceArticles: neutralArticle.source_articles?.map(article => ({
            id: article.id,
            title: article.title,
            biasScore: article.bias_score,
            sourceLink: article.source_link || '',
            summary: article.summary || []
        })) || []
    };
};

// API service functions
const API_BASE_URL = 'http://localhost:8000';

// Function to send a chat message to the backend
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending message to API:', error);
        throw error;
    }
}; 