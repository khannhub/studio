

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WizardLayout from '@/components/wizard/WizardLayout';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step2SelectServices, { incorporationPackages as usaPackages, processingTimePackages as intlPackages } from '@/components/wizard/steps/Step2SelectServices';
import Step3ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails'; // Corrected path
import Step4ReviewPay from '@/components/wizard/steps/Step3ReviewPay';          // Corrected path
import Step5Confirmation from '@/components/wizard/steps/Step4Confirmation';    // Corrected path
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
    price: 0, 
    packageName: '',
    aiBestRecommendation: null,
    aiAlternativeRecommendations: [],
    aiRecommendedJurisdiction: '',
    aiRecommendedState: '',
    aiRecommendedCompanyType: '',
    aiRecommendedReasoning: '',
    aiGeneratedIntroText: '',
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
    const isUsaExclusiveFocus = needsAssessment?.region === 'USA (Exclusive Focus)';

    if (incorporation?.jurisdiction && incorporation.companyType && (isUsaExclusiveFocus || incorporation.jurisdiction !== 'United States of America' || incorporation.state)) {
      let incName = `${incorporation.jurisdiction}`;
      if (incorporation.jurisdiction === 'United States of America' && incorporation.state) {
        const stateLabel = US_STATES_LIST.find(s => s.value === incorporation.state)?.label || incorporation.state.split('-')[0];
        incName += ` (${stateLabel})`;
      }
      incName += ` ${incorporation.companyType} Formation`;
      
      // Main incorporation service item (base price from selection)
      items.push({
        id: 'incorporation_service',
        name: incName,
        price: incorporation.price || 0, // Base price from selection
        quantity: 1,
        description: `Base service for company formation in ${incorporation.jurisdiction}.`,
      });

      // Add Package/Processing Time as a separate item
      if (incorporation.packageName) {
        const activePackagesList = isUsaExclusiveFocus ? usaPackages : intlPackages;
        const pkg = activePackagesList.find(p => p.name === incorporation.packageName);
        if (pkg) {
          items.push({
            id: 'incorporation_package_tier',
            name: `${incorporation.packageName} ${isUsaExclusiveFocus ? 'Package' : 'Processing'}`,
            price: pkg.price, // This price is now potentially randomized
            quantity: 1,
            description: pkg.features.join('; '),
          });
        }
      }
      
      // Add Government/State Fees as a separate item
      const feePrice = isUsaExclusiveFocus || incorporation.jurisdiction === 'United States of America' ? USA_STATE_FEE : INTERNATIONAL_GOVERNMENT_FEE;
      const feeName = isUsaExclusiveFocus || incorporation.jurisdiction === 'United States of America' ? 'State Fees (USA)' : 'Government Fees';
      items.push({
          id: 'government_fees',
          name: feeName,
          price: feePrice,
          quantity: 1,
          description: `Mandatory fees for ${incorporation.jurisdiction} ${incorporation.state ? '(' + (US_STATES_LIST.find(s => s.value === incorporation.state)?.label || incorporation.state.split('-')[0]) + ')' : ''}.`,
      });
    }


    addOns?.forEach(addon => {
      if (addon.selected) { 
        items.push({ id: addon.id, name: addon.name, price: addon.price, quantity: 1, description: `${addon.description || addon.name + ' service.'}` });
      }
    });
    
    setDerivedOrderItems(items);
    // Also update orderData.orderItems for consistency if other parts of the app rely on it directly
    updateOrderDataHandler(prev => ({ ...prev, orderItems: items }));

  }, [orderData.incorporation, orderData.addOns, orderData.needsAssessment?.region, updateOrderDataHandler]);


  const addOrderItemHandler = useCallback((item: OrderItem) => {
    updateOrderDataHandler(prevData => {
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
  }, [updateOrderDataHandler]);

  const updateOrderItemHandler = useCallback((itemId: string, updates: Partial<OrderItem>) => {
     updateOrderDataHandler(prevData => {
        const newItems = (prevData.orderItems || []).map(item =>
            item.id === itemId ? {...item, ...updates} : item
        );
        return { ...prevData, orderItems: newItems };
     });
  }, [updateOrderDataHandler]);


  const removeOrderItemHandler = useCallback((itemId: string) => {
    updateOrderDataHandler(prevData => {
        let newItems = (prevData.orderItems || []).filter(item => item.id !== itemId);
        let updatedAddOns = prevData.addOns || [];
        let updatedIncorporation = { ...prevData.incorporation } as OrderData['incorporation'];

        if (itemId === 'incorporation_service') {
            // If main service is removed, also remove related fees and package
            newItems = newItems.filter(item => item.id !== 'government_fees' && item.id !== 'incorporation_package_tier');
            if (updatedIncorporation) {
                updatedIncorporation.packageName = undefined; // Clear package selection
                updatedIncorporation.price = 0; // Clear base price
                updatedIncorporation.jurisdiction = ''; // Clear selections
                updatedIncorporation.state = '';
                updatedIncorporation.companyType = '';
            }
        } else if (itemId === 'incorporation_package_tier' && updatedIncorporation) {
            updatedIncorporation.packageName = undefined; // Clear package selection if package item is removed
        }
        
        // If an add-on item is removed from the cart, deselect it in the addOns array
        if (itemId !== 'incorporation_service' && itemId !== 'government_fees' && itemId !== 'incorporation_package_tier') {
             updatedAddOns = (prevData.addOns || []).map(addon =>
                addon.id === itemId ? { ...addon, selected: false } : addon
            );
        }
        return { ...prevData, orderItems: newItems, addOns: updatedAddOns, incorporation: updatedIncorporation };
    });
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
    orderItems: derivedOrderItems, // Pass derivedOrderItems to steps for display
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
      case 3: return <Step3ProvideDetails {...stepProps} />;
      case 4: return <Step4ReviewPay {...stepProps} />;
      case 5: return <Step5Confirmation {...stepProps} />;
      default: return <Step1DefineConfigure {...stepProps} />;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      stepNames={STEPS.map(s => s.name)}
      orderItems={derivedOrderItems} // Pass derivedOrderItems to WizardLayout for summary
    >
      {renderStepContent()}
    </WizardLayout>
  );
}

