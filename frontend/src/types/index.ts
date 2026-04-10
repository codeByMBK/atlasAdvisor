export interface Recommendation {
  id: string;
  category: "index" | "schema" | "query";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  fixSuggestion: string;
  codeExample: string;
  collectionName: string;
}

export interface AnalysisResult {
  databaseName: string;
  collectionsAnalysed: number;
  recommendations: Recommendation[];
  analysedAt: string; // ISO string from JSON
}

export interface AbTestEvent {
  sessionId: string;
  variant: "A" | "B";
  event:
    | "recommendation_viewed"
    | "recommendation_clicked"
    | "fix_applied"
    | "fix_dismissed";
  recommendationId: string;
  recommendationCategory: string;
  timestamp: string; // ISO string
}

export interface VariantMetrics {
  variant: "A" | "B";
  totalSessions: number;
  totalViews: number;
  totalClicks: number;
  totalApplied: number;
  clickThroughRate: number;
  applyRate: number;
}

export interface GlobalStats {
  totalAnalyses: number;
  lastUpdated: string | null;
}
