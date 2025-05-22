
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step2SelectServices from '@/components/wizard/steps/Step2SelectServices';
import Step2ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails';
import Step3ReviewPay from '@/components/wizard/steps/Step3ReviewPay';
import Step4Confirmation from '@/components/wizard/steps/Step4Confirmation';
import type { OrderData, OrderItem, IncorporationRecommendationItem, NeedsAssessment } from '@/lib/types';
import { STEPS, INITIAL_ADDONS } from '@/lib/types';

// Define incorporationPackages here if it's used in total calculation or summary
const incorporationPackages = [
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
];


const initialOrderData: OrderData = {
  userEmail: '',
  userPhone: '',
  needsAssessment: {
    region: '',
    businessActivities: [],
    strategicObjectives: [],
    businessDescription: '',
  } as NeedsAssessment,
  incorporation: {
    jurisdiction: '',
    state: '',
    companyType: '',
    price: 0, 
    packageName: '',
    aiBestRecommendation: null,
    aiAlternativeRecommendations: [],
    aiRecommendedJurisdiction: '',
    aiRecommendedState: '',
    aiRecommendedCompanyType: '',
    aiRecommendedReasoning: '',
  },
  bankingAssistance: {
    selected: false,
    option: '',
    price: 0,
    reasoning: '',
  },
  addOns: INITIAL_ADDONS.map(addon => ({ ...addon })),
  companyNames: { firstChoice: '', secondChoice: '', thirdChoice: '' },
  directors: [{ id: `dir-${Date.now()}`, fullName: '', email: '' }],
  shareholders: [{ id: `sh-${Date.now()}`, fullNameOrEntityName: '', shareAllocation: '' }],
  primaryContact: { id: `contact-${Date.now()}`, fullName: '', email: '', phone: '' },
  deliveryAddress: { street: '', city: '', stateOrProvince: '', postalCode: '', country: '' },
  extraRequests: '',
  billingAddress: { street: '', city: '', stateOrProvince: '', postalCode: '', country: '', useDeliveryAddress: false, usePrimaryContactAddress: false },
  paymentMethod: undefined,
  orderId: '',
  orderStatus: undefined,
  orderItems: [],
};


export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  const [derivedOrderItems, setDerivedOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderDataHandler = useCallback((data: Partial<OrderData> | ((prevData: OrderData) => Partial<OrderData>)) => {
    setOrderData(prev => {
      const newPartialData = typeof data === 'function' ? data(prev) : data;
      const updatedData = { ...prev, ...newPartialData };
      
      if (newPartialData.addOns) {
        updatedData.addOns = newPartialData.addOns;
      }
      if (newPartialData.incorporation) {
        updatedData.incorporation = { ...prev.incorporation, ...newPartialData.incorporation };
      }
      if (newPartialData.bankingAssistance) {
        updatedData.bankingAssistance = { ...prev.bankingAssistance, ...newPartialData.bankingAssistance };
      }
      if (newPartialData.needsAssessment) {
        updatedData.needsAssessment = { ...prev.needsAssessment, ...newPartialData.needsAssessment };
      }
      
      return updatedData;
    });
  }, []);
  
  useEffect(() => {
    const items: OrderItem[] = [];
    const { incorporation, bankingAssistance, addOns } = orderData;

    if (incorporation?.jurisdiction && incorporation.companyType && incorporation.price !== undefined) {
      let name = `${incorporation.jurisdiction}`;
      if (incorporation.jurisdiction === 'United States of America' && incorporation.state) {
        const stateLabel = incorporation.state.split('-')[0];
        name += ` (${stateLabel})`;
      }
      name += ` ${incorporation.companyType}`;

      let totalIncorporationPrice = incorporation.price || 0; 
      let description = `Formation in ${incorporation.jurisdiction}.`;

      if (incorporation.packageName) {
        const pkg = incorporationPackages.find(p => p.name === incorporation.packageName);
        if (pkg) {
          name += ` - ${incorporation.packageName} Package`;
          totalIncorporationPrice += pkg.price; 
          description += ` Includes ${incorporation.packageName} features.`;
        }
      }
      
      if (totalIncorporationPrice > 0 || (incorporation.price === 0 && incorporation.packageName) ) {
         items.push({
            id: 'incorporation_service',
            name: name,
            price: totalIncorporationPrice,
            quantity: 1,
            description: description.trim(),
          });
      }
    }

    if (bankingAssistance?.selected && bankingAssistance.price && bankingAssistance.price > 0) {
      items.push({
        id: 'banking_assistance',
        name: 'Banking Assistance',
        price: bankingAssistance.price,
        quantity: 1,
        description: bankingAssistance.option || `Access to banking partners. ${bankingAssistance.reasoning ? 'Reasoning: '+bankingAssistance.reasoning.substring(0,100)+'...' : ''}`.trim(),
      });
    }
    addOns?.forEach(addon => {
      if (addon.selected && addon.price > 0) {
        items.push({ id: addon.id, name: addon.name, price: addon.price, quantity: 1, description: `${addon.name} service.` });
      }
    });
    
    setDerivedOrderItems(items);
    setOrderData(prev => ({ ...prev, orderItems: items }));

  }, [orderData.incorporation, orderData.bankingAssistance, orderData.addOns]);


  const addOrderItemHandler = useCallback((item: OrderItem) => {
    setOrderData(prevData => {
        const existingItems = prevData.orderItems || [];
        const existingItemIndex = existingItems.findIndex(i => i.id === item.id);
        let newItems;
        if (existingItemIndex > -1) {
            newItems = existingItems.map((i, idx) => 
                idx === existingItemIndex ? { ...i, quantity: i.quantity + item.quantity, price: item.price, name: item.name, description: item.description } : i
            );
        } else {
            newItems = [...existingItems, item];
        }
        return { ...prevData, orderItems: newItems };
    });
  }, []);

  const updateOrderItemHandler = useCallback((itemId: string, updates: Partial<OrderItem>) => {
     setOrderData(prevData => {
        const newItems = (prevData.orderItems || []).map(item => 
            item.id === itemId ? {...item, ...updates} : item
        );
        return { ...prevData, orderItems: newItems };
     });
  }, []);


  const removeOrderItemHandler = useCallback((itemId: string) => {
    setOrderData(prevData => {
        const newItems = (prevData.orderItems || []).filter(item => item.id !== itemId);
        let updatedBankingAssistance = prevData.bankingAssistance;
        if (itemId === 'banking_assistance') {
          updatedBankingAssistance = { ...prevData.bankingAssistance, selected: false, price: 0 };
        }
        
        let updatedAddOns = prevData.addOns;
        if (itemId !== 'banking_assistance' && itemId !== 'incorporation_service') { 
             updatedAddOns = (prevData.addOns || []).map(addon => 
                addon.id === itemId ? { ...addon, selected: false } : addon
            );
        }
        return { ...prevData, orderItems: newItems, bankingAssistance: updatedBankingAssistance, addOns: updatedAddOns };
    });
  }, []);


  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);
  
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  }, []);


  const stepProps = {
    orderData,
    updateOrderData: updateOrderDataHandler,
    orderItems: derivedOrderItems, 
    addOrderItem: addOrderItemHandler,
    updateOrderItem: updateOrderItemHandler,
    removeOrderItem: removeOrderItemHandler,
    goToNextStep,
    goToPrevStep,
    goToStep,
    currentStep,
    isLoading,
    setIsLoading,
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <Step1DefineConfigure {...stepProps} />;
      case 2: return <Step2SelectServices {...stepProps} />;
      case 3: return <Step2ProvideDetails {...stepProps} />;
      case 4: return <Step3ReviewPay {...stepProps} />;
      case 5: return <Step4Confirmation {...stepProps} />;
      default: return <Step1DefineConfigure {...stepProps} />;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      stepNames={STEPS.map(s => s.name)}
      orderItems={derivedOrderItems}
    >
      {renderStepContent()}
    </WizardLayout>
  );
}
