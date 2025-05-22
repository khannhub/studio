
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface IncorporationDetails {
  jurisdiction?: string;
  companyType?: string;
  packageName?: string; 
  processingTime?: string;
  price?: number;
  reasoning?: string; // From AI
}

export interface BankingAssistance {
  selected?: boolean;
  option?: string;
  price?: number;
  reasoning?: string; // From AI
}

export interface AddOn {
  id: string;
  name: string;
  selected: boolean;
  price: number;
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
  // Add other relevant fields like DOB, nationality, address if needed for directors/shareholders
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

export interface OrderData {
  userEmail?: string; // Step 1: Initial email
  userPhone?: string; // Step 1: Initial phone
  needsAssessment?: {
    purpose?: string;
    priorities?: string;
    region?: string;
    bankingIntent?: boolean;
    businessDescription?: string;
  };
  incorporation?: IncorporationDetails;
  bankingAssistance?: BankingAssistance;
  addOns?: AddOn[];
  
  // Step 2 Details
  companyNames?: CompanyNameChoices;
  directors?: Person[];
  shareholders?: ShareholderInfo[];
  primaryContact?: Person & { isSameAsDirectorId?: string };
  deliveryAddress?: Address;
  extraRequests?: string;

  // Step 3 Details
  billingAddress?: Address & { useDeliveryAddress?: boolean; usePrimaryContactAddress?: boolean; };
  paymentMethod?: "card" | "paypal" | "bank_transfer";
  paymentDetails?: { // Sensitive details would not be stored long-term like this
    cardNumber?: string; // Example, real integration would use PCI compliant methods
    expiryDate?: string;
    cvv?: string;
  };
  
  // Step 4 Details
  orderId?: string;
  orderStatus?: "success" | "pending" | "failed";
  paymentDate?: string; 
}

export interface StepComponentProps {
  orderData: OrderData;
  updateOrderData: (data: Partial<OrderData> | ((prevData: OrderData) => Partial<OrderData>)) => void;
  orderItems: OrderItem[];
  addOrderItem: (item: OrderItem) => void;
  updateOrderItem: (itemId: string, updates: Partial<OrderItem>) => void;
  removeOrderItem: (itemId: string) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  currentStep: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const STEPS = [
  { id: 1, name: 'Define & Configure', path: 'define' },
  { id: 2, name: 'Details', path: 'details' },
  { id: 3, name: 'Review & Pay', path: 'review' },
  { id: 4, name: 'Confirmation', path: 'confirmation' },
];

export const INITIAL_ADDONS: AddOn[] = [
  { id: 'nominee_director', name: 'Nominee Director', selected: false, price: 500 },
  { id: 'nominee_shareholder', name: 'Nominee Shareholder', selected: false, price: 400 },
  { id: 'mail_forwarding', name: 'Mail Forwarding & Virtual Office', selected: false, price: 350 },
  { id: 'accounting_services', name: 'Annual Accounting Services', selected: false, price: 750 },
];
