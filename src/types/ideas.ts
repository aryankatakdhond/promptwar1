export type IdeaStatus = 'generated' | 'saved' | 'rejected' | 'applied';

export interface ColorPalette {
  name: string;
  colors: string[]; // hex codes
  description: string;
}

export interface CreativeConcept {
  id: string;
  eventId: string;
  name: string;
  creativeDirection: string;
  whyItFits: string;
  colorPalette: ColorPalette;
  decorSuggestions: string[];
  invitationIdeas: string[];
  menuDirection: string;
  activities: string[];
  entertainmentIdeas: string[];
  budgetConscious: string[];
  sustainableOptions: string[];
  accessibilityConsiderations: string;
  estimatedCostImpact: 'below-budget' | 'on-budget' | 'slight-premium' | 'premium';
  practicalRequirements: string[];
  status: IdeaStatus;
  generatedBy: 'gemini' | 'local-engine';
  createdAt: string;
}
