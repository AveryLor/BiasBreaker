export interface Article {
  id: number;
  source: string;
  title: string;
  excerpt: string;
  perspective: 'Liberal' | 'Conservative' | 'Centrist' | 'Progressive' | 'Libertarian' | 'Liberals' | 'Social Democrats' | 'Classical Liberals' | 'Conservatives';
  date: string;
  url: string;
  biasScore?: number;
  content?: string;
}

export interface SourceArticle {
  id: string;
  title: string;
  biasScore: number;
  sourceLink: string;
  summary: string[];
}

export interface MergedArticle {
  title: string;
  summary: string;
  sourcesConsidered: string[];
  sourceArticles?: SourceArticle[];
}

export interface NewsData {
  articles: Article[];
  mergedArticle: MergedArticle;
}

export const dummyNewsData: NewsData = {
  articles: [
    {
      id: 1,
      source: "BBC News",
      title: "Global Climate Summit Ends with New Emissions Targets",
      excerpt: "World leaders have agreed to ambitious new carbon reduction goals, though implementation details remain vague.",
      perspective: "Centrist",
      date: "March 20, 2023",
      url: "https://example.com/bbc-climate"
    },
    {
      id: 2,
      source: "The Guardian",
      title: "Climate Summit: Historic Agreement Reached as Nations Pledge Urgent Action",
      excerpt: "Environmental advocates celebrate watershed moment as countries commit to aggressive timeline for reducing emissions.",
      perspective: "Liberal",
      date: "March 20, 2023",
      url: "https://example.com/guardian-climate"
    },
    {
      id: 3,
      source: "Wall Street Journal",
      title: "Climate Deal Raises Economic Concerns as Implementation Costs Loom",
      excerpt: "Business leaders question feasibility of rapid transition timeline and express concerns about impact on energy markets.",
      perspective: "Conservative",
      date: "March 20, 2023",
      url: "https://example.com/wsj-climate"
    },
    {
      id: 4,
      source: "Al Jazeera",
      title: "Developing Nations Secure Climate Funding in Summit Agreement",
      excerpt: "Agreement includes provisions for technology transfer and financial support to help vulnerable countries adapt to changing climate.",
      perspective: "Progressive",
      date: "March 21, 2023",
      url: "https://example.com/aljazeera-climate"
    },
    {
      id: 5,
      source: "Bloomberg",
      title: "Markets React to Climate Deal as Green Energy Stocks Surge",
      excerpt: "Renewable energy sector sees significant gains while traditional energy companies face investor uncertainty following summit.",
      perspective: "Centrist",
      date: "March 21, 2023",
      url: "https://example.com/bloomberg-climate"
    },
    {
      id: 6,
      source: "Fox News",
      title: "Climate Summit Results in Costly New Mandates for American Industry",
      excerpt: "Critics argue new emission targets will harm economic growth and lead to job losses in key sectors of the economy.",
      perspective: "Conservative",
      date: "March 20, 2023",
      url: "https://example.com/fox-climate"
    },
  ],
  mergedArticle: {
    title: "Global Climate Summit: A Comprehensive Analysis of the New Agreement",
    summary: "The recent climate summit concluded with a landmark agreement that has generated diverse reactions worldwide. Leaders from 195 countries agreed to new emissions targets aimed at limiting global warming to 1.5°C above pre-industrial levels.\n\nThe agreement includes provisions for developed nations to provide financial support to developing countries, helping them transition to cleaner energy sources and adapt to climate impacts already underway. Additionally, a framework for carbon markets was established to incentivize emission reductions.\n\nReactions to the agreement vary significantly. Environmental advocates generally praise the ambitious targets, while expressing concerns about accountability mechanisms. Business interests acknowledge the necessity of action but raise questions about implementation costs and timelines. Developing nations welcome financial commitments but some argue the support remains insufficient given the scale of the challenge.\n\nMarkets have responded with increased investment in renewable energy sectors, while traditional energy companies face uncertainty. Political reactions have largely followed ideological lines, with progressive leaders celebrating the agreement and conservative voices expressing concerns about economic impacts.\n\nThe true test of the agreement will be in its implementation over the coming years, as countries translate commitments into concrete policies and actions.",
    sourcesConsidered: ["BBC News", "The Guardian", "Wall Street Journal", "Al Jazeera", "Bloomberg", "Fox News"]
  }
}; 