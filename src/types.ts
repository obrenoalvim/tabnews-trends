export interface TrendNode {
  id: string;
  label: string;
  count: number;
  tabcoins: number;
}

export interface TrendEdge {
  source: string;
  target: string;
  weight: number;
}

export interface TrendingEntry {
  label: string;
  recentCount: number;
  previousCount: number;
  growthPct: number;
}

export interface TrendsData {
  generatedAt: string;
  postsAnalyzed: number;
  dateRange: { from: string | null; to: string | null };
  recentMonths: string[];
  previousMonths: string[];
  nodes: TrendNode[];
  edges: TrendEdge[];
  trending: TrendingEntry[];
  insights: string[];
}
