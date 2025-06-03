export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface IncorporationRecommendationItem {
  jurisdiction: string;
  state?: string; // For US states, format "FullName-Abbreviation"
  companyType: string;
  shortDescription: string; // A brief tagline for the recommendation card
  reasoning: string; // Detailed reasoning, can include markdown
  price: number; // Base price for this specific jurisdiction/type combination
  isBestPick?: boolean; // Flag if this is the top recommendation
}

export interface IncorporationDetails {
  jurisdiction?: string; // User's current selection
  state?: string; // User's current selection for US state, format "FullName-Abbreviation"
  companyType?: string; // User's current selection
  price?: number; // Base price of the selected jurisdiction/state/companyType combination

  packageName?: string; // e.g., 'Basic', 'Standard', 'Premium' or 'Normal', 'Express', 'Super Urgent'

  aiBestRecommendation?: IncorporationRecommendationItem | null;
  aiAlternativeRecommendations?: IncorporationRecommendationItem[];

  // Storing the AI's direct recommendation separately
  aiRecommendedJurisdiction?: string;
  aiRecommendedState?: string;
  aiRecommendedCompanyType?: string;
  aiRecommendedReasoning?: string;
  aiGeneratedIntroText?: string; // For the intro text in Step 2
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  selected: boolean;
  requiresDetails?: boolean;
  recommendationReasoning?: string | null; // For AI-driven suggestions

  // Fields for specific add-ons, make them optional
  preferredCurrency?: string;         // For Banking Assistance
  preferredBankingRegion?: string;    // For Banking Assistance
  mailForwardingPreference?: string;  // For Virtual Office (e.g., 'none', 'scan_email', 'physical_monthly')
  trademarkName?: string;             // For Trademark Registration
  // Add other specific fields as new add-ons with details are introduced
}

export interface CompanyNameChoices {
  firstChoice?: string;
  secondChoice?: string;
  thirdChoice?: string;
}

export enum ShareholderType {
  INDIVIDUAL = "individual",
  CORPORATE_ENTITY = "corporate_entity",
}

export interface Person {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface ShareholderInfo extends Person {
  type?: ShareholderType;
  entityName?: string; // if corporate
  registrationNumber?: string; // if corporate
  shareAllocation?: string;
}

export interface Address {
  street?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
}

export interface NeedsAssessment {
  region?: string;
  businessActivities?: string[];
  strategicObjectives?: string[];
  businessDescription?: string;
}

export interface OrderData {
  userEmail?: string;
  userPhone?: string;
  needsAssessment?: NeedsAssessment;
  incorporation?: IncorporationDetails;
  addOns: AddOn[];

  companyNames?: CompanyNameChoices;
  directors?: Person[];
  shareholders?: ShareholderInfo[];
  primaryContact?: Person & { phone?: string }; // Combined Person with optional phone
  deliveryAddress?: Address;
  extraRequests?: string;

  billingAddress?: Address & { useDeliveryAddress?: boolean, usePrimaryContactAddress?: boolean };
  paymentMethod?: 'card' | 'paypal' | 'bank_transfer' | 'none_required'; // Added none_required
  paymentDetails?: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  };

  orderId?: string;
  orderStatus?: 'pending' | 'success' | 'failed' | 'completed_free'; // Added completed_free
  paymentDate?: string;
  // orderItems?: OrderItem[]; // Removed: items are derived
}

export interface StepComponentProps {
  orderData: OrderData;
  updateOrderData: (data: Partial<OrderData> | ((prevData: OrderData) => Partial<OrderData>)) => void;
  orderItems: OrderItem[]; // This will be derivedOrderItems from WizardPage state
  // addOrderItem: (item: OrderItem) => void; // Removed
  // updateOrderItem: (itemId: string, updates: Partial<OrderItem>) => void; // Removed
  // removeOrderItem: (itemId: string) => void; // Removed, direct item manipulation isn't done by steps this way
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  currentStep: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const STEPS = [
  { id: 0, name: 'Welcome', path: 'welcome' },
  { id: 1, name: 'Define Needs', path: 'define' },
  { id: 2, name: 'Select Services', path: 'services' },
  { id: 3, name: 'Provide Details', path: 'details' },
  { id: 4, name: 'Review & Pay', path: 'review' },
  { id: 5, name: 'Confirmation', path: 'confirmation' },
];

export const INITIAL_ADDONS: AddOn[] = [
  { id: 'banking_assistance', name: 'Banking Assistance', selected: false, price: 250, description: "Dedicated support for opening a bank account with our partner institutions." },
  { id: 'nominee_director', name: 'Nominee Director', selected: false, price: 500, description: "Appoint a professional director to fulfill statutory requirements and enhance privacy." },
  { id: 'nominee_shareholder', name: 'Nominee Shareholder', selected: false, price: 400, description: "Utilize a nominee shareholder to hold shares on your behalf, maintaining confidentiality." },
  { id: 'mail_forwarding', name: 'Mail Forwarding & Virtual Office', selected: false, price: 350, description: "Receive and forward your company's mail to an address of your choice. Includes a prestigious business address." },
  { id: 'accounting_services', name: 'Annual Accounting Services', selected: false, price: 750, description: "Comprehensive accounting and bookkeeping services to ensure your company remains compliant." },
];

export const JURISDICTIONS_LIST = [
  'Anguilla', 'Bahamas', 'Belize', 'British Virgin Islands', 'Cayman Islands',
  'Cyprus', 'Gibraltar', 'Hong Kong', 'Malaysia', 'Malta', 'Marshall Islands',
  'Mauritius', 'Netherlands', 'Panama', 'Saint Lucia', 'Samoa', 'Seychelles',
  'Singapore', 'St. Vincent', 'St. Kitts and Nevis', 'Swiss', 'UAE',
  'United Kingdom', 'United States of America', 'Vanuatu', 'Vietnam'
];

export const US_STATES_LIST = [
  { value: "Alabama-AL", label: "Alabama" }, { value: "Alaska-AK", label: "Alaska" },
  { value: "Arizona-AZ", label: "Arizona" }, { value: "Arkansas-AR", label: "Arkansas" },
  { value: "California-CA", label: "California" }, { value: "Colorado-CO", label: "Colorado" },
  { value: "Connecticut-CT", label: "Connecticut" }, { value: "Delaware-DE", label: "Delaware" },
  { value: "District of Columbia-DC", label: "District of Columbia" }, { value: "Florida-FL", label: "Florida" },
  { value: "Georgia-GA", label: "Georgia" }, { value: "Hawaii-HI", label: "Hawaii" },
  { value: "Idaho-ID", label: "Idaho" }, { value: "Illinois-IL", label: "Illinois" },
  { value: "Indiana-IN", label: "Indiana" }, { value: "Iowa-IA", label: "Iowa" },
  { value: "Kansas-KS", label: "Kansas" }, { value: "Kentucky-KY", label: "Kentucky" },
  { value: "Louisiana-LA", label: "Louisiana" }, { value: "Maine-ME", label: "Maine" },
  { value: "Maryland-MD", label: "Maryland" }, { value: "Massachusetts-MA", label: "Massachusetts" },
  { value: "Michigan-MI", label: "Michigan" }, { value: "Minnesota-MN", label: "Minnesota" },
  { value: "Mississippi-MS", label: "Mississippi" }, { value: "Missouri-MO", label: "Missouri" },
  { value: "Nebraska-NE", label: "Nebraska" }, { value: "Nevada-NV", label: "Nevada" },
  { value: "New Hampshire-NH", label: "New Hampshire" }, { value: "New Jersey-NJ", label: "New Jersey" },
  { value: "New Mexico-NM", label: "New Mexico" }, { value: "New York-NY", label: "New York" },
  { value: "North Carolina-NC", label: "North Carolina" }, { value: "North Dakota-ND", label: "North Dakota" },
  { value: "Ohio-OH", label: "Ohio" }, { value: "Oklahoma-OK", label: "Oklahoma" },
  { value: "Oregon-OR", label: "Oregon" }, { value: "Pennsylvania-PA", label: "Pennsylvania" },
  { value: "Rhode Island-RI", label: "Rhode Island" }, { value: "South Carolina-SC", label: "South Carolina" },
  { value: "South Dakota-SD", label: "South Dakota" }, { value: "Tennessee-TN", label: "Tennessee" },
  { value: "Texas-TX", label: "Texas" }, { value: "Utah-UT", label: "Utah" },
  { value: "Vermont-VT", label: "Vermont" }, { value: "Virginia-VA", label: "Virginia" },
  { value: "Washington-WA", label: "Washington" }, { value: "West Virginia-WV", label: "West Virginia" },
  { value: "Wisconsin-WI", label: "Wisconsin" }, { value: "Wyoming-WY", label: "Wyoming" }
];

export const US_COMPANY_TYPES_LIST = [
  'Limited Liability Company',
  'S Corporation',
  'C Corporation'
];

export const INTERNATIONAL_COMPANY_TYPES_LIST = [
  'Company Limited', 'Limited Liability Company', 'International Business Company',
  'Private Limited Company', 'Public Limited Company', 'Limited by Shares',
  'Global Business Company', 'Authorised Company', 'Limited Liability Partnership',
  'Exempted Company', 'Corporation'
];

// Fee Constants
export const USA_STATE_FEE = 150;
export const INTERNATIONAL_GOVERNMENT_FEE = 100;
export const CUSTOM_INCORP_BASE_PRICE = 100; // Nominal starting price for custom configs
