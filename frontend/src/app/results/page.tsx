'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import DEISettings from '@/components/DEISettings';
import LoadingState from '@/components/LoadingState';
import SynthesizedArticle from '@/components/SynthesizedArticle';
import NewsCard from '@/components/NewsCard';
import ComparisonView from '@/components/ComparisonView';

// Mock data for now - in real app, this would come from API
const mockSources = [
  {
    id: '1',
    name: 'Global News Network',
    category: 'mainstream' as const,
    ideology: 'centrist' as const,
    title: 'Climate Change Policy: Nations Debate Carbon Tax Implementation',
    content: 'World leaders gathered at the UN Climate Summit to discuss carbon taxation policies. Proponents argue carbon taxes are essential for reducing emissions, while critics worry about economic impacts on developing nations.\n\nThe European Union has proposed a aggressive carbon tax policy, which has faced mixed reactions. The United States delegation expressed concerns about implementation costs, while China emphasized the need for equitable application across all nations.\n\nExperts suggest that carbon taxes alone won\'t solve climate issues, but they represent an important market-based solution that could drive innovation in clean energy.',
    url: 'https://example.com/news/1',
    date: '2023-04-15',
    imageUrl: 'https://via.placeholder.com/400x300',
  },
  {
    id: '2',
    name: 'Progressive Voice',
    category: 'independent' as const,
    ideology: 'liberal' as const,
    title: 'Carbon Tax: A Necessary Step to Combat Climate Emergency',
    content: 'The introduction of carbon taxes is not just beneficial but essential if we hope to mitigate the worst effects of the climate crisis. Recent studies show that properly implemented carbon taxes can significantly reduce emissions while generating revenue for green initiatives.\n\nAdvocates argue that the revenue from carbon taxes should be directed toward supporting vulnerable communities most affected by climate change. This approach ensures that the transition to a green economy doesn\'t disproportionately burden those already marginalized.\n\nRecommendations include a progressive tax structure that places higher burdens on heavy industrial emitters while protecting low-income households from increased energy costs.',
    url: 'https://example.com/news/2',
    date: '2023-04-14',
    imageUrl: 'https://via.placeholder.com/400x300',
  },
  {
    id: '3',
    name: 'Business Insight',
    category: 'mainstream' as const,
    ideology: 'conservative' as const,
    title: 'Carbon Tax Proposals Raise Economic Concerns Among Businesses',
    content: 'The business community has expressed significant concerns about proposed carbon tax policies, warning that aggressive implementation could harm economic growth and lead to job losses in energy-intensive sectors.\n\nIndustry leaders are advocating for a gradual approach that would allow businesses time to adapt their operations and invest in cleaner technologies. They emphasize that sudden policy changes could disrupt supply chains and increase consumer costs.\n\nAlternative approaches suggested include tax incentives for green investments and public-private partnerships to develop carbon capture technologies, which could achieve emission reductions without the economic disruption of carbon taxes.',
    url: 'https://example.com/news/3',
    date: '2023-04-16',
    imageUrl: 'https://via.placeholder.com/400x300',
  },
  {
    id: '4',
    name: 'Indigenous Climate Coalition',
    category: 'underrepresented' as const,
    ideology: 'undefined' as const,
    title: 'Indigenous Communities Demand Voice in Carbon Tax Discussions',
    content: 'Indigenous leaders from around the world are calling for greater representation in climate policy discussions, emphasizing that carbon tax proposals must respect indigenous sovereignty and traditional ecological knowledge.\n\nMany indigenous communities are on the frontlines of climate change impacts yet have historically been excluded from policy decisions. Representatives argue that any carbon pricing mechanism must include provisions for indigenous-led conservation projects and ensure benefits flow to affected communities.\n\nThe coalition proposes a framework that would recognize the role of indigenous stewardship in carbon sequestration and provide direct funding for community-based climate resilience initiatives.',
    url: 'https://example.com/news/4',
    date: '2023-04-13',
    imageUrl: 'https://via.placeholder.com/400x300',
  },
];

// Mock synthesized article
const mockSynthesizedArticle = {
  title: 'Carbon Tax Policies: A Comprehensive Analysis of Global Perspectives',
  content: 'Carbon taxation has emerged as a key policy tool in addressing climate change, with diverse stakeholders presenting varied perspectives on implementation strategies, economic impacts, and social equity considerations.\n\nWorld leaders at the recent UN Climate Summit debated the merits of carbon taxes, with developed nations generally supporting market-based approaches while developing countries expressed concerns about economic burdens. The European Union has proposed an aggressive carbon tax policy, which has received mixed reactions internationally.\n\nProgressive advocates emphasize that carbon taxes are essential for meaningful emissions reduction and argue that revenue should be directed toward supporting vulnerable communities most affected by climate change. Studies suggest that properly implemented carbon taxes can significantly reduce emissions while generating revenue for green initiatives.\n\nIn contrast, business representatives warn that aggressive implementation could harm economic growth and lead to job losses in energy-intensive sectors. Industry leaders advocate for a gradual approach with tax incentives for green investments and public-private partnerships to develop carbon capture technologies.\n\nNotably, indigenous communities are demanding greater representation in these policy discussions. Indigenous leaders emphasize that carbon tax proposals must respect their sovereignty and traditional ecological knowledge. They propose frameworks that would recognize the role of indigenous stewardship in carbon sequestration and provide direct funding for community-based climate resilience initiatives.\n\nExperts suggest that effective carbon tax policies must balance multiple considerations: emission reduction targets, economic impacts, social equity, and implementation feasibility. A growing consensus indicates that complementary policies are needed alongside carbon taxes, including investment in renewable energy infrastructure, regulatory standards, and support for communities transitioning away from carbon-intensive industries.\n\nAs nations continue to develop their climate strategies, the debate over carbon taxation highlights the complex challenge of addressing global climate change while respecting diverse economic realities, social contexts, and cultural perspectives.',
  sources: [
    { name: 'Global News Network', url: 'https://example.com/news/1', category: 'mainstream' as const },
    { name: 'Progressive Voice', url: 'https://example.com/news/2', category: 'independent' as const },
    { name: 'Business Insight', url: 'https://example.com/news/3', category: 'mainstream' as const },
    { name: 'Indigenous Climate Coalition', url: 'https://example.com/news/4', category: 'underrepresented' as const },
  ],
  topic: 'Climate Change Policy',
  date: new Date().toISOString(),
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('synthesized');
  const [deiSettings, setDeiSettings] = useState<string[]>([]);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle new search
  const handleSearch = (newQuery: string) => {
    // In a real app, this would trigger a new API call
    setLoading(true);
    console.log(`Searching for: ${newQuery}`);
    // Then redirect to /results?q=newQuery
  };

  // Handle DEI settings change
  const handleDEISettingsChange = (settings: string[]) => {
    setDeiSettings(settings);
    // In a real app, this would trigger a new API call with the updated settings
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Bar Section */}
      <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div>
          <DEISettings onSettingsChange={handleDEISettingsChange} />
        </div>
      </div>

      {/* Results Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Results for: <span className="text-blue-600 dark:text-blue-400">{query}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {mockSources.length} sources found • {deiSettings.length > 0 ? 
            `DEI Focus: ${deiSettings.map(s => s.replace('-', ' ')).join(', ')}` : 
            'No DEI focus applied'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('synthesized')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'synthesized'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Synthesized Article
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sources'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Source Articles
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Side-by-Side Comparison
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : (
        <div className="mt-8">
          {activeTab === 'synthesized' && (
            <SynthesizedArticle 
              title={mockSynthesizedArticle.title}
              content={mockSynthesizedArticle.content}
              sources={mockSynthesizedArticle.sources}
              topic={mockSynthesizedArticle.topic}
              date={mockSynthesizedArticle.date}
              deiSettings={deiSettings}
            />
          )}

          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockSources.map((source) => (
                <NewsCard
                  key={source.id}
                  title={source.title}
                  source={source.name}
                  description={source.content.substring(0, 150) + '...'}
                  imageUrl={source.imageUrl}
                  sourceCategory={source.category as any}
                  ideology={source.ideology as any}
                  url={source.url}
                  date={source.date}
                />
              ))}
            </div>
          )}

          {activeTab === 'comparison' && (
            <ComparisonView 
              topic={query || 'Climate Change Policy'} 
              sources={mockSources}
            />
          )}
        </div>
      )}
    </div>
  );
} 