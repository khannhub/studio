
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step2ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails';
import Step3ReviewPay from '@/components/wizard/steps/Step3ReviewPay';
import Step4Confirmation from '@/components/wizard/steps/Step4Confirmation';
import type { OrderData, OrderItem, Person, ShareholderInfo } from '@/lib/types';
import { STEPS, INITIAL_ADDONS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  addOns: INITIAL_ADDONS.map(addon => ({ ...addon })), // Ensure it's a new array
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
};


export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateOrderDataHandler = useCallback((data: Partial<OrderData> | ((prevData: OrderData) => Partial<OrderData>)) => {
    setOrderData(prev => {
      const newPartialData = typeof data === 'function' ? data(prev) : data;
      return { ...prev, ...newPartialData };
    });
  }, []);
  
  // Derive order items from orderData
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
      if (addon.selected) {
        items.push({ id: addon.id, name: addon.name, price: addon.price, quantity: 1 });
      }
    });
    setOrderItems(items);
  }, [orderData.incorporation, orderData.bankingAssistance, orderData.addOns]);

  const addOrderItemHandler = useCallback((item: OrderItem) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        return prevItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity, price: item.price, name: item.name, description: item.description } : i);
      }
      return [...prevItems, item];
    });
  }, []);

  const updateOrderItemHandler = useCallback((itemId: string, updates: Partial<OrderItem>) => {
     setOrderItems(prevItems => 
      prevItems.map(item => item.id === itemId ? {...item, ...updates} : item)
     );
  }, []);


  const removeOrderItemHandler = useCallback((itemId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
     // Also update the source in orderData if it's an addon or banking assistance
    if (itemId === 'banking_assistance') {
      updateOrderDataHandler(prev => ({ bankingAssistance: { ...prev.bankingAssistance, selected: false }}));
    } else {
      updateOrderDataHandler(prev => ({
        addOns: prev.addOns?.map(addon => addon.id === itemId ? { ...addon, selected: false } : addon)
      }));
    }
  }, [updateOrderDataHandler]);


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
    orderItems,
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
      case 2: return <Step2ProvideDetails {...stepProps} />;
      case 3: return <Step3ReviewPay {...stepProps} />;
      case 4: return <Step4Confirmation {...stepProps} />;
      default: return <Step1DefineConfigure {...stepProps} />;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      stepNames={STEPS.map(s => s.name)}
      orderItems={orderItems}
    >
      {renderStepContent()}
    </WizardLayout>
  );
}
