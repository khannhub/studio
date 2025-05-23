

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step2SelectServices, { incorporationPackages as usaPackages, processingTimePackages as intlPackages } from '@/components/wizard/steps/Step2SelectServices';
import Step2ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails';
import Step3ReviewPay from '@/components/wizard/steps/Step3ReviewPay';
import Step4Confirmation from '@/components/wizard/steps/Step4Confirmation';
import type { OrderData, OrderItem, IncorporationRecommendationItem, NeedsAssessment } from '@/lib/types';
import { STEPS, INITIAL_ADDONS, USA_STATE_FEE, INTERNATIONAL_GOVERNMENT_FEE, US_STATES_LIST } from '@/lib/types';


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
    price: 0, // This will be the base price of the jurisdiction/state/type combination
    packageName: '',

    aiBestRecommendation: null,
    aiAlternativeRecommendations: [],

    aiRecommendedJurisdiction: '',
    aiRecommendedState: '',
    aiRecommendedCompanyType: '',
    aiRecommendedReasoning: '',
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
      if (newPartialData.needsAssessment) {
        updatedData.needsAssessment = { ...prev.needsAssessment, ...newPartialData.needsAssessment };
      }
      if (newPartialData.companyNames) {
        updatedData.companyNames = { ...prev.companyNames, ...newPartialData.companyNames };
      }
      if (newPartialData.directors) {
        updatedData.directors = newPartialData.directors;
      }
       if (newPartialData.shareholders) {
        updatedData.shareholders = newPartialData.shareholders;
      }
      if (newPartialData.primaryContact) {
        updatedData.primaryContact = { ...prev.primaryContact, ...newPartialData.primaryContact };
      }
       if (newPartialData.deliveryAddress) {
        updatedData.deliveryAddress = { ...prev.deliveryAddress, ...newPartialData.deliveryAddress };
      }
      if (newPartialData.billingAddress) {
        updatedData.billingAddress = { ...prev.billingAddress, ...newPartialData.billingAddress };
      }
      return updatedData;
    });
  }, []);

  useEffect(() => {
    const items: OrderItem[] = [];
    const { incorporation, addOns, needsAssessment } = orderData;
    const isUsaFocus = needsAssessment?.region === 'USA (Exclusive Focus)';

    let governmentFeeAdded = false;

    if (incorporation?.jurisdiction && incorporation.companyType && (isUsaFocus || incorporation.jurisdiction !== 'United States of America' || incorporation.state)) {
      let incName = `${incorporation.jurisdiction}`;
      if (incorporation.jurisdiction === 'United States of America' && incorporation.state) {
        const stateLabel = US_STATES_LIST.find(s => s.value === incorporation.state)?.label || incorporation.state.split('-')[0];
        incName += ` (${stateLabel})`;
      }
      incName += ` ${incorporation.companyType} Formation`;
      
      // Add the main incorporation service item (base price only)
      items.push({
        id: 'incorporation_service',
        name: incName,
        price: incorporation.price || 0, // Base price from selection
        quantity: 1,
        description: `Base service for company formation in ${incorporation.jurisdiction}.`,
      });

      // Add Package/Processing Time as a separate item
      if (incorporation.packageName) {
        const activePackages = isUsaFocus ? usaPackages : intlPackages;
        const pkg = activePackages.find(p => p.name === incorporation.packageName);
        if (pkg) {
          items.push({
            id: 'incorporation_package_tier',
            name: `${incorporation.packageName} ${isUsaFocus ? 'Package' : 'Processing'}`,
            price: pkg.price,
            quantity: 1,
            description: pkg.features.join('; '),
          });
        }
      }
      
      // Add Government/State Fees conditionally
      const feePrice = isUsaFocus || incorporation.jurisdiction === 'United States of America' ? USA_STATE_FEE : INTERNATIONAL_GOVERNMENT_FEE;
      const feeName = isUsaFocus || incorporation.jurisdiction === 'United States of America' ? 'State Fees (USA)' : 'Government Fees';
      items.push({
          id: 'government_fees',
          name: feeName,
          price: feePrice,
          quantity: 1,
          description: `Mandatory fees for ${incorporation.jurisdiction} ${incorporation.state ? '(' + (US_STATES_LIST.find(s => s.value === incorporation.state)?.label || incorporation.state.split('-')[0]) + ')' : ''}.`,
      });
      governmentFeeAdded = true;
    }


    addOns?.forEach(addon => {
      if (addon.selected) { 
        items.push({ id: addon.id, name: addon.name, price: addon.price, quantity: 1, description: `${addon.description || addon.name + ' service.'}` });
      }
    });
    
    if (!governmentFeeAdded) {
        const feeIndex = items.findIndex(item => item.id === 'government_fees');
        if (feeIndex > -1) {
            items.splice(feeIndex, 1);
        }
    }

    setDerivedOrderItems(items);
    setOrderData(prev => ({ ...prev, orderItems: items }));

  }, [orderData.incorporation, orderData.addOns, orderData.needsAssessment?.region]);


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
    updateOrderData(prevData => {
        let newItems = (prevData.orderItems || []).filter(item => item.id !== itemId);
        let updatedAddOns = prevData.addOns;
        let updatedIncorporation = prevData.incorporation;

        if (itemId === 'incorporation_service') {
            // If main incorporation service is removed, also remove government fees and package/tier
            newItems = newItems.filter(item => item.id !== 'government_fees' && item.id !== 'incorporation_package_tier');
            updatedIncorporation = { ...prevData.incorporation, packageName: undefined }; // Clear package selection
        }
        
        if (itemId !== 'incorporation_service' && itemId !== 'government_fees' && itemId !== 'incorporation_package_tier') {
             updatedAddOns = (prevData.addOns || []).map(addon =>
                addon.id === itemId ? { ...addon, selected: false } : addon
            );
        }
        return { ...prevData, orderItems: newItems, addOns: updatedAddOns, incorporation: updatedIncorporation };
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

