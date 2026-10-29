export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskCategory =
  | 'budget'
  | 'timeline'
  | 'vendor'
  | 'venue'
  | 'guest'
  | 'logistics'
  | 'weather'
  | 'legal'
  | 'other';

export interface RiskItem {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  explanation: string;
  affectedEntities: string[];
  recommendedAction: string;
  actionTarget?: string; // tab or section to navigate to
  isResolved: boolean;
  detectedAt: string;
}

export interface ReadinessScore {
  total: number; // 0-100
  breakdown: ReadinessBreakdown[];
  lastCalculated: string;
}

export interface ReadinessBreakdown {
  factor: string;
  score: number; // 0-100 for this factor
  weight: number; // 0-1, how much this factor contributes
  details: string;
}
