'use client';

import WizardLayout from '@/components/wizard/WizardLayout';
import Step0Welcome from '@/components/wizard/steps/Step0Welcome';
import Step1DefineConfigure from '@/components/wizard/steps/Step1DefineConfigure';
import Step3ProvideDetails from '@/components/wizard/steps/Step2ProvideDetails'; // Corrected path
import Step2SelectServices, { processingTimePackages as intlPackages, incorporationPackages as usaPackages } from '@/components/wizard/steps/Step2SelectServices';
import Step4ReviewPay from '@/components/wizard/steps/Step3ReviewPay'; // Corrected path
import Step5Confirmation from '@/components/wizard/steps/Step4Confirmation'; // Corrected path
import type { NeedsAssessment, OrderData, OrderItem } from '@/lib/types';
import { INITIAL_ADDONS, INTERNATIONAL_GOVERNMENT_FEE, STEPS, US_STATES_LIST, USA_STATE_FEE } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';


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
  // orderItems: [], // Removed - items are derived into derivedOrderItems local state
};


export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
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
            price: pkg.price,
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

  }, [orderData.incorporation, orderData.addOns, orderData.needsAssessment?.region]);


  // Example of how item removal would work by modifying source data (addOns, incorporation)
  // This is not directly wired to UI buttons in OrderSummary in this iteration.
  const handleRemoveDerivedItem = useCallback((itemId: string) => {
    updateOrderDataHandler(prevData => {
      let updatedAddOns = prevData.addOns ? [...prevData.addOns] : [];
      let updatedIncorporation = prevData.incorporation ? { ...prevData.incorporation } : {};

      if (itemId === 'incorporation_service') {
        // Clear main incorporation details, package. Fees will be removed by effect.
        updatedIncorporation.jurisdiction = '';
        updatedIncorporation.state = '';
        updatedIncorporation.companyType = '';
        updatedIncorporation.price = 0;
        updatedIncorporation.packageName = undefined;
      } else if (itemId === 'incorporation_package_tier') {
        updatedIncorporation.packageName = undefined;
      } else if (itemId === 'government_fees') {
        // This item is purely derived. To "remove" it, clear the core incorporation.
        // For simplicity, we can assume this is handled if 'incorporation_service' is removed.
        // Or, if a specific "remove fees" button existed (it doesn't), it might also clear main details.
        updatedIncorporation.jurisdiction = '';
        updatedIncorporation.state = '';
        updatedIncorporation.companyType = '';
        updatedIncorporation.price = 0;
        updatedIncorporation.packageName = undefined;
      } else {
        // Must be an add-on
        updatedAddOns = (prevData.addOns || []).map(addon =>
          addon.id === itemId ? { ...addon, selected: false } : addon
        );
      }
      return { ...prevData, addOns: updatedAddOns, incorporation: updatedIncorporation as OrderData['incorporation'] };
    });
  }, [updateOrderDataHandler]);


  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  }, []);


  const stepProps = {
    orderData,
    updateOrderData: updateOrderDataHandler,
    orderItems: derivedOrderItems, // Pass derivedOrderItems to steps for display
    // removeOrderItem: handleRemoveDerivedItem, // Not currently used by steps directly
    goToNextStep,
    goToPrevStep,
    goToStep,
    currentStep,
    isLoading,
    setIsLoading,
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <Step0Welcome {...stepProps} />;
      case 1: return <Step1DefineConfigure {...stepProps} />;
      case 2: return <Step2SelectServices {...stepProps} />;
      case 3: return <Step3ProvideDetails {...stepProps} />;
      case 4: return <Step4ReviewPay {...stepProps} />;
      case 5: return <Step5Confirmation {...stepProps} />;
      default: return <Step0Welcome {...stepProps} />;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep + 1}
      totalSteps={STEPS.length}
      stepNames={STEPS.map(s => s.name)}
      orderItems={derivedOrderItems} // Pass derivedOrderItems to WizardLayout for summary
    >
      {renderStepContent()}
    </WizardLayout>
  );
}
