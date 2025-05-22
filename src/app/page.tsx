
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step2SelectServices from '@/components/wizard/steps/Step2SelectServices'; // New Import
import Step2ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails';
import Step3ReviewPay from '@/components/wizard/steps/Step3ReviewPay';
import Step4Confirmation from '@/components/wizard/steps/Step4Confirmation';
import type { OrderData, OrderItem } from '@/lib/types'; // Person, ShareholderInfo removed as they are not directly used in initialOrderData here
import { STEPS, INITIAL_ADDONS } from '@/lib/types';
// Removed useToast import as it's not used directly in this file

const initialOrderData: OrderData = {
  userEmail: '',
  userPhone: '',
  needsAssessment: {
    purpose: '',
    priorities: '',
    region: '',
    bankingIntent: undefined,
    businessDescription: '',
  },
  incorporation: {
    jurisdiction: '',
    companyType: '',
    packageName: '',
    price: 0,
  },
  bankingAssistance: {
    selected: false,
    option: '',
    price: 0,
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
  orderItems: [], // Initialize orderItems
};


export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  // Order items are now part of orderData to be passed around, but also managed locally for UI updates.
  // This local orderItems state will derive from orderData.orderItems for consistency.
  const [derivedOrderItems, setDerivedOrderItems] = useState<OrderItem[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  // const { toast } = useToast(); // Not used here

  const updateOrderDataHandler = useCallback((data: Partial<OrderData> | ((prevData: OrderData) => Partial<OrderData>)) => {
    setOrderData(prev => {
      const newPartialData = typeof data === 'function' ? data(prev) : data;
      const updatedData = { ...prev, ...newPartialData };
      
      // If addOns are being updated, ensure they are fully part of the new object
      if (newPartialData.addOns) {
        updatedData.addOns = newPartialData.addOns;
      }
      
      return updatedData;
    });
  }, []);
  
  // Derive order items from orderData whenever relevant parts of orderData change
  useEffect(() => {
    const items: OrderItem[] = [];
    if (orderData.incorporation?.packageName && orderData.incorporation.price && orderData.incorporation.price > 0) {
      items.push({
        id: 'incorporation_service',
        name: `${orderData.incorporation.jurisdiction || 'Selected'} ${orderData.incorporation.companyType || 'Company'} - ${orderData.incorporation.packageName} Package`,
        price: orderData.incorporation.price,
        quantity: 1,
        description: `Includes ${orderData.incorporation.packageName} features. Jurisdiction: ${orderData.incorporation.jurisdiction}, Type: ${orderData.incorporation.companyType}. ${orderData.incorporation.reasoning ? 'AI Reasoning: '+orderData.incorporation.reasoning.substring(0,100)+'...' : ''}`.trim(),
      });
    }
    if (orderData.bankingAssistance?.selected && orderData.bankingAssistance.price && orderData.bankingAssistance.price > 0) {
      items.push({
        id: 'banking_assistance',
        name: 'Banking Assistance',
        price: orderData.bankingAssistance.price,
        quantity: 1,
        description: orderData.bankingAssistance.option || `Access to banking partners. ${orderData.bankingAssistance.reasoning ? 'AI Reasoning: '+orderData.bankingAssistance.reasoning.substring(0,100)+'...' : ''}`.trim(),
      });
    }
    orderData.addOns?.forEach(addon => {
      if (addon.selected && addon.price > 0) { // Ensure price is positive to avoid adding $0 items
        items.push({ id: addon.id, name: addon.name, price: addon.price, quantity: 1, description: `${addon.name} service.` });
      }
    });
    
    setDerivedOrderItems(items); // Update local derived state
    // Also update orderData.orderItems to keep it in sync for passing to steps
    // This direct mutation of orderData here might be better handled inside updateOrderDataHandler or a dedicated effect
    // For now, to ensure consistency, let's update it.
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
        // Also update the source in orderData if it's an addon or banking assistance
        let updatedBankingAssistance = prevData.bankingAssistance;
        if (itemId === 'banking_assistance') {
          updatedBankingAssistance = { ...prevData.bankingAssistance, selected: false, price: 0 };
        }
        
        let updatedAddOns = prevData.addOns;
        if (itemId !== 'banking_assistance' && itemId !== 'incorporation_service') { // Check if it's an addon
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
    orderItems: derivedOrderItems, // Pass derived items for UI
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
      orderItems={derivedOrderItems} // Pass derived items to layout
    >
      {renderStepContent()}
    </WizardLayout>
  );
}
