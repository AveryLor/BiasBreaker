import SearchBar from "@/components/SearchBar";
import InfoBanner from "@/components/InfoBanner";
import TrendingTopics from "@/components/TrendingTopics";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-10 mt-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          News From Every Perspective
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
          Discover balanced, AI-generated news that synthesizes diverse viewpoints, including underrepresented voices.
        </p>
        <Link href="/compare" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Try Article Comparison
        </Link>
      </div>

      {/* Info Banner */}
      <InfoBanner />

      {/* Search Section */}
      <div className="my-8">
        <SearchBar />
      </div>

      {/* Featured Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 col-span-1 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 text-lg font-bold mb-2">1. Search</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Enter any news topic to find diverse perspectives from across the web.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 text-lg font-bold mb-2">2. Analyze</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Our AI categorizes articles by source type and ideological stance.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 text-lg font-bold mb-2">3. Synthesize</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Receive a balanced AI-generated article that includes all perspectives.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">DEI Focus</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Customize your news to prioritize diverse and underrepresented voices:
          </p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
              <span>Indigenous perspectives</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2"></span>
              <span>LGBTQ+ voices</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2"></span>
              <span>Global South reporting</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-2"></span>
              <span>Disability community insights</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Trending Topics */}
      <TrendingTopics topics={[]} />
    </div>
  );
}
