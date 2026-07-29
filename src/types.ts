/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkType = 'Autónomo' | 'Empleado' | 'Empresario' | 'Estudiante' | 'Desempleado';
export type RiskLevel = 'Bajo' | 'Medio' | 'Alto';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'withdrawal' | 'loan';
export type InvestmentType = 'stock' | 'etf' | 'crypto' | 'bond' | 'cash' | 'real_estate' | 'other';
export type CalendarEventType = 'bill' | 'insurance' | 'subscription' | 'mortgage' | 'rent' | 'tax' | 'reminder';

export interface UserProfile {
  name: string;
  age: number;
  country: string;
  currency: string;
  profession: string;
  company?: string;
  workType: WorkType;
  
  // Incomes (Monthly)
  incomeFixed: number;
  incomeVariable: number;
  incomeBusiness: number;
  incomeOther: number;

  // Expenses (Monthly)
  expenseHousing: number;
  expenseFood: number;
  expenseTransport: number;
  expenseSubscriptions: number;
  expenseLeisure: number;
  expenseEducation: number;
  expenseHealth: number;
  expenseTaxes: number;
  expenseOther: number;

  // Initial accounts
  currentSavings: number;
  currentInvestments: number;
  debts: number;
  riskLevel: RiskLevel;
  primaryGoals: string[]; // ['Comprar coche', 'Comprar casa', 'Viajar', etc.]
  businessSector?: string; // Mode business customization
  securityPin?: string;
  protectedTabs?: string[];
  knowledgeLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  imageUrl?: string;
  location?: string;
  paymentMethod: string;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: string;
  suggestedAction?: string;
}

export interface Budget {
  category: string;
  limitAmount: number;
  spentAmount: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  xpReward?: number; // compatible alias
  targetAmount: number;
  currentAmount: number;
  durationWeeks: number;
  isCompleted: boolean;
  category: string;
  progressionPercent?: number; // compatible alias
}

export interface InvestmentAsset {
  id: string;
  assetName: string;
  assetType: InvestmentType;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  
  // Compatible fields for custom portfolio UI
  ticker?: string;
  shares?: number;
  buyPrice?: number;
}

export interface VintedListing {
  id: string;
  title: string;
  purchasePrice: number;
  sellPrice: number;
  commission: number;
  shipping: number;
  advertising: number;
  status: 'draft' | 'listed' | 'sold';
  dateAdded: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  isPaid: boolean;
  category?: string; // compatible alias
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SavedChat {
  id: string;
  title: string;
  history: ChatMessage[];
  updatedAt: string;
}

export interface FinancialPlan {
  id: string;
  title: string;
  type: 'saving' | 'investment' | 'debt_payoff' | 'expense_cut' | 'car' | 'home' | 'business';
  targetAmount?: number;
  timeframeMonths: number;
  actions: string[];
  progressionPercent: number;
  simulationScenarios: {
    optimistic: string;
    moderate: string;
    conservative: string;
  };
}

export interface AppState {
  userProfile: UserProfile | null;
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  challenges: Challenge[];
  investments: InvestmentAsset[];
  vintedListings: VintedListing[];
  calendarEvents: CalendarEvent[];
  chatHistory: ChatMessage[];
  financialPlans: FinancialPlan[];
  userXP: number;
  userLevel: number;
  badges?: string[];
  premiumExpiresAt?: string;
  theme: 'light' | 'dark';
  userRank?: 'Normal' | 'VIP';
  aiTokensUsed?: number;
  plan?: 'Free' | 'Premium';
  tokenUsage?: number;
  savedChats?: SavedChat[];
}
