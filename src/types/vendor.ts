export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'decor'
  | 'entertainment'
  | 'transport'
  | 'staffing'
  | 'bakery'
  | 'florist'
  | 'beauty'
  | 'attire'
  | 'invitations'
  | 'audio-visual'
  | 'security'
  | 'other';

export type VendorStatus =
  | 'not-started'
  | 'researching'
  | 'contacted'
  | 'quote-received'
  | 'booked'
  | 'cancelled';

export interface VendorPaymentMilestone {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface VendorEntry {
  id: string;
  eventId: string;
  category: VendorCategory;
  requirement: string;
  businessName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  status: VendorStatus;
  estimatedCost: number;
  quotedCost?: number;
  researchDeadline: string; // ISO
  bookingDeadline: string; // ISO
  comparisonNotes?: string;
  questionsToAsk: string[];
  redFlags: string[];
  contractSigned: boolean;
  depositPaid: boolean;
  cancellationTerms?: string;
  paymentMilestones: VendorPaymentMilestone[];
  isCritical: boolean;
  isIllustrative: boolean; // true for demo entries
  relatedTaskId?: string;
  relatedBudgetCategoryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
