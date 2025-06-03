'use client';

import { prefillCompanyDetails, type PrefillCompanyDetailsInput } from '@/ai/flows/prefill-company-details';
import { recommendAddons } from '@/ai/flows/recommend-addons';
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { AddOn, IncorporationDetails, IncorporationRecommendationItem, NeedsAssessment, StepComponentProps } from '@/lib/types';
import { CUSTOM_INCORP_BASE_PRICE, INTERNATIONAL_COMPANY_TYPES_LIST, JURISDICTIONS_LIST, US_COMPANY_TYPES_LIST, US_STATES_LIST } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Package, Settings, ShoppingBag, Sparkles } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

// Fixed prices for USA packages
export const incorporationPackages = [
  { name: 'Premium', price: 700, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
  { name: 'Standard', price: 450, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Basic', price: 200, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
].sort((a, b) => b.price - a.price); // Sort by descending price

// Fixed prices for International processing times
export const processingTimePackages = [
  { name: 'Super Urgent', price: 450, features: ['Processing within 30 mins - 4 hours', 'Dedicated Support Line', 'Digital & Physical Docs Priority'] },
  { name: 'Express', price: 250, features: ['Processing within 1/2 working day', 'Priority Support', 'Digital Docs First'] },
  { name: 'Normal', price: 0, features: ['Processing within 1 working day', 'Standard Support', 'Standard Document Delivery'] },
].sort((a, b) => b.price - a.price); // Sort by descending price

const assignStaticPriceToManualConfig = (jurisdiction?: string, state?: string, companyType?: string): number => {
  if (!jurisdiction || !companyType) return CUSTOM_INCORP_BASE_PRICE;
  if (jurisdiction === 'United States of America' && !state) return CUSTOM_INCORP_BASE_PRICE;

  // This function should mirror the logic used in Step1DefineConfigure's assignStaticPriceToRecommendation
  if (jurisdiction === 'United States of America') {
    if (state === 'Delaware-DE' && companyType === 'Limited Liability Company') return 199;
    if (state === 'Wyoming-WY' && companyType === 'Limited Liability Company') return 149;
    if (state === 'California-CA' && companyType === 'C Corporation') return 299;
    return 249;
  }
  if (jurisdiction === 'Singapore' && companyType === 'Private Limited Company') return 499;
  if (jurisdiction === 'British Virgin Islands' && companyType === 'International Business Company') return 799;
  if (jurisdiction === 'Hong Kong' && companyType === 'Limited by Shares') return 650;

  return 250; // Default for other custom international or unmapped US
};

// --- MASTER ADD-ON LIST ---
interface MasterAddonDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  requiresDetails?: boolean;
}

const MASTER_ADDON_LIST_DEFINITIONS: MasterAddonDefinition[] = [
  { id: 'banking_assistance', name: 'Bank Account Assistance', description: 'Expert guidance and support for opening a corporate bank account in your chosen jurisdiction or elsewhere.', price: 350, requiresDetails: true },
  { id: 'nominee_director', name: 'Nominee Director Service', description: 'Appoint a professional nominee director for enhanced privacy or to meet local substance requirements (availability and terms vary by jurisdiction).', price: 1200 },
  { id: 'nominee_shareholder', name: 'Nominee Shareholder Service', description: 'Utilize a nominee shareholder for confidentiality purposes, holding shares on your behalf (availability varies by jurisdiction).', price: 800 },
  { id: 'virtual_office', name: 'Virtual Office Package', description: 'Secure a prestigious business address, mail handling, and optional call forwarding services.', price: 500, requiresDetails: true },
  { id: 'accounting_services', name: 'Annual Accounting & Tax Essentials', description: 'Basic annual accounting, bookkeeping, and tax compliance services to keep your new company in good standing.', price: 1500 },
  { id: 'trademark_registration', name: 'Trademark Registration', description: 'Protect your brand identity by registering your trademark in your key markets.', price: 600, requiresDetails: true },
  { id: 'company_seal_kit', name: 'Official Company Seal & Kit', description: 'Receive a professional company seal and a kit with essential corporate documents.', price: 150 },
];

// Mock AI Flow for recommending add-ons
const mockRecommendAddons = async (input: {
  mainServiceDetails?: Partial<IncorporationDetails>;
  userNeeds?: Partial<NeedsAssessment>;
}): Promise<{ recommendedAddonIds: string[], introText?: string, recommendationReasonings: Record<string, string> }> => {
  console.log("AI: Recommending addons for", input.mainServiceDetails, input.userNeeds);
  await new Promise(resolve => setTimeout(resolve, 1200));

  const recommendedAddonIds: string[] = [];
  const recommendationReasonings: Record<string, string> = {};
  let introText = "Enhance your incorporation with these specially recommended add-on services.";

  if (!input.mainServiceDetails || !input.userNeeds) {
    return { recommendedAddonIds, introText, recommendationReasonings };
  }

  if (input.userNeeds.strategicObjectives?.includes('Access Specific Banking') || input.mainServiceDetails.jurisdiction === 'Singapore' || input.mainServiceDetails.companyType === 'Private Limited Company') {
    recommendedAddonIds.push('banking_assistance');
    recommendationReasonings['banking_assistance'] = "Essential for smooth financial operations and international transactions.";
  }
  if (input.userNeeds.strategicObjectives?.includes('Privacy & Confidentiality') && input.mainServiceDetails.jurisdiction !== 'United States of America') {
    recommendedAddonIds.push('nominee_director');
    recommendationReasonings['nominee_director'] = "Offers an added layer of privacy for your company\'s directorship.";
  }
  if (input.userNeeds.businessActivities?.includes('E-commerce & Online Services')) {
    if (!recommendedAddonIds.includes('virtual_office')) {
      recommendedAddonIds.push('virtual_office');
      recommendationReasonings['virtual_office'] = "Provides a professional address for your online business operations.";
    }
    if (!recommendedAddonIds.includes('trademark_registration')) {
      recommendedAddonIds.push('trademark_registration');
      recommendationReasonings['trademark_registration'] = "Crucial for protecting your brand in the digital marketplace.";
    }
  }
  if (input.mainServiceDetails.companyType === 'C Corporation' || input.mainServiceDetails.jurisdiction === 'United States of America') {
    if (!recommendedAddonIds.includes('accounting_services')) {
      recommendedAddonIds.push('accounting_services');
      recommendationReasonings['accounting_services'] = "Key for maintaining compliance, especially for US corporations.";
    }
  }
  if (recommendedAddonIds.length > 0) {
    introText = "Based on your choices, we think these add-ons would be a great fit! We\'ve pre-selected them for you.";
  } else {
    introText = "Explore our range of add-ons to further customize your setup.";
  }
  return { recommendedAddonIds: [...new Set(recommendedAddonIds)], introText, recommendationReasonings };
};

const Step2SelectServices: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  goToNextStep,
  goToPrevStep,
  isLoading: isGlobalLoading,
  setIsLoading: setGlobalIsLoading,
}) => {
  const { toast } = useToast();
  const [isPrimaryRegionUSA, setIsPrimaryRegionUSA] = useState(false);
  const [currentCompanyTypes, setCurrentCompanyTypes] = useState<string[]>(INTERNATIONAL_COMPANY_TYPES_LIST);
  const [selectedIncorporationKey, setSelectedIncorporationKey] = useState<string | null>(null);
  const [manualConfigAccordionValue, setManualConfigAccordionValue] = useState<string | undefined>(undefined);
  const [isPrefilling, startPrefillingTransition] = useTransition();
  const [isRecommendAddonsLoading, setIsRecommendAddonsLoading] = useState(false);
  const [addonRecommendationIntro, setAddonRecommendationIntro] = useState<string>("Consider these popular services for your new company.");
  const lastRecommendationInputsRef = useRef<string>('');

  const recommendationIntroText = orderData.incorporation?.aiGeneratedIntroText || "Here are some incorporation options based on your stated needs and objectives.";
  const displayedPackages = useMemo(() => isPrimaryRegionUSA ? incorporationPackages : processingTimePackages, [isPrimaryRegionUSA]);

  // Initialize/Sync addOns in orderData with MASTER_ADDON_LIST_DEFINITIONS
  useEffect(() => {
    // Check if addOns array is present and has the same number of items as the master list.
    // This ensures that if the master list definition changes (e.g. new addon added), it re-initializes.
    const orderAddonsPopulatedAndMatchingMaster =
      orderData.addOns &&
      orderData.addOns.length === MASTER_ADDON_LIST_DEFINITIONS.length &&
      MASTER_ADDON_LIST_DEFINITIONS.every(masterAddon =>
        orderData.addOns.find(orderAddon => orderAddon.id === masterAddon.id)
      );

    if (!orderAddonsPopulatedAndMatchingMaster) {
      const initialAddons = MASTER_ADDON_LIST_DEFINITIONS.map(def => {
        const existingAddon = orderData.addOns?.find(oa => oa.id === def.id); // Try to find existing to preserve details
        return {
          ...def, // Spread master definition first (name, description, price, requiresDetails)
          selected: existingAddon?.selected || false, // Preserve existing selection or default to false
          recommendationReasoning: existingAddon?.recommendationReasoning || null,
          // Preserve other user-entered details if they exist
          preferredCurrency: def.id === 'banking_assistance' ? (existingAddon?.preferredCurrency || '') : undefined,
          preferredBankingRegion: def.id === 'banking_assistance' ? (existingAddon?.preferredBankingRegion || '') : undefined,
          mailForwardingPreference: def.id === 'virtual_office' ? (existingAddon?.mailForwardingPreference || 'none') : undefined,
          trademarkName: def.id === 'trademark_registration' ? (existingAddon?.trademarkName || '') : undefined,
        } as AddOn;
      });
      updateOrderData(prev => ({ ...prev, addOns: initialAddons }));
    }
  }, [orderData.addOns, updateOrderData]);

  const fetchAndApplyRecommendedAddons = useCallback(async (inputs: {
    mainServiceDetails: Partial<Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType' | 'packageName'>>;
    userNeeds: NeedsAssessment;
  }) => {
    const { mainServiceDetails, userNeeds } = inputs;

    if (!mainServiceDetails.jurisdiction || !userNeeds) {
      console.warn("fetchAndApplyRecommendedAddons called with incomplete inputs.");
      return;
    }

    setIsRecommendAddonsLoading(true);
    try {
      const availableAddonsForAI = MASTER_ADDON_LIST_DEFINITIONS.map(addon => ({
        id: addon.id,
        name: addon.name,
        description: addon.description,
      }));

      const aiOutput = await recommendAddons({
        mainServiceDetails,
        userNeeds,
        availableAddons: availableAddonsForAI,
      });

      const { recommendedAddonIds, introText, recommendationReasonings } = aiOutput;

      setAddonRecommendationIntro(introText || "Explore these suggested add-ons.");

      updateOrderData(prev => {
        // Ensure prev.addOns is based on a fully initialized list if it wasn't already
        const baseAddons = (prev.addOns && prev.addOns.length === MASTER_ADDON_LIST_DEFINITIONS.length)
          ? prev.addOns
          : MASTER_ADDON_LIST_DEFINITIONS.map(def => ({
            ...def,
            selected: false,
            recommendationReasoning: null,
            // Initialize other detail fields for consistency if re-initializing
            preferredCurrency: def.id === 'banking_assistance' ? '' : undefined,
            preferredBankingRegion: def.id === 'banking_assistance' ? '' : undefined,
            mailForwardingPreference: def.id === 'virtual_office' ? 'none' : undefined,
            trademarkName: def.id === 'trademark_registration' ? '' : undefined,
          } as AddOn));

        const updatedAddons = baseAddons.map(addon => ({
          ...addon,
          selected: recommendedAddonIds.includes(addon.id) || addon.selected,
          recommendationReasoning: recommendationReasonings[addon.id] || addon.recommendationReasoning,
        }));
        return { ...prev, addOns: updatedAddons as AddOn[] };
      });

      if (recommendedAddonIds.length > 0) {
        toast({
          title: "Add-on Suggestions Updated!",
          description: "We\'ve analyzed your choices and updated add-on recommendations.",
          duration: 4000, // Slightly longer for AI interaction
        });
      }
    } catch (error) {
      console.error("Error fetching AI add-on recommendations:", error);
      toast({ title: "AI Recommendation Error", description: "Could not fetch AI add-on suggestions at this time. Please select manually.", variant: "destructive" });
    } finally {
      setIsRecommendAddonsLoading(false);
    }
  }, [updateOrderData, toast, setIsRecommendAddonsLoading, setAddonRecommendationIntro]); // Removed stable dependencies like master list for useCallback as it doesn't change during component lifecycle

  // Trigger AI Addon recommendations when key incorporation details change
  useEffect(() => {
    const { jurisdiction, state, companyType, packageName } = orderData.incorporation || {};
    const needs = orderData.needsAssessment;

    if (jurisdiction && needs) {
      const currentInputsKey = JSON.stringify({
        jurisdiction,
        state,
        companyType,
        packageName,
        needsAssessment: needs, // Stringify the needs object to compare its content
      });

      if (currentInputsKey !== lastRecommendationInputsRef.current) {
        fetchAndApplyRecommendedAddons({
          mainServiceDetails: { jurisdiction, state, companyType, packageName },
          userNeeds: needs
        }).finally(() => {
          // Update the ref after the call, regardless of success or failure of the AI call itself,
          // to prevent re-fetching with the exact same inputs if this effect re-runs before state settles.
          lastRecommendationInputsRef.current = currentInputsKey;
        });
      }
    }
  }, [
    orderData.incorporation?.jurisdiction,
    orderData.incorporation?.state,
    orderData.incorporation?.companyType,
    orderData.incorporation?.packageName,
    orderData.needsAssessment, // Re-run if needsAssessment object reference changes
    fetchAndApplyRecommendedAddons // Now a stable dependency
  ]);

  useEffect(() => {
    const primaryRegionIsUSAEntry = orderData.needsAssessment?.region === 'USA (Exclusive Focus)';
    setIsPrimaryRegionUSA(primaryRegionIsUSAEntry);
    const currentJurisdiction = orderData.incorporation?.jurisdiction;
    if (primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') {
      setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
    } else {
      setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
    }
  }, [orderData.needsAssessment?.region, orderData.incorporation?.jurisdiction]);

  useEffect(() => {
    const currentJurisdiction = orderData.incorporation?.jurisdiction;
    const currentState = orderData.incorporation?.state;
    const currentCompanyType = orderData.incorporation?.companyType;
    const currentPrice = orderData.incorporation?.price;
    const currentPackageName = orderData.incorporation?.packageName;
    const aiBestRec = orderData.incorporation?.aiBestRecommendation;
    const primaryRegionIsUSAEntry = orderData.needsAssessment?.region === 'USA (Exclusive Focus)';

    const hasValidIncorporationSelection =
      currentJurisdiction && currentCompanyType && currentPrice !== undefined &&
      ((primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') ? !!currentState : true);

    if (hasValidIncorporationSelection) {
      const key = `${currentJurisdiction}-${currentState || 'none'}-${currentCompanyType}`;
      setSelectedIncorporationKey(key);
      if (!currentPackageName && displayedPackages.length > 0) {
        updateOrderData(prev => ({
          incorporation: {
            ...prev.incorporation,
            packageName: displayedPackages[Math.floor(displayedPackages.length / 2)].name,
          } as IncorporationDetails
        }));
      }
    } else if (aiBestRec && !currentJurisdiction && !currentState && !currentCompanyType) {
      updateOrderData(prev => ({
        incorporation: {
          ...prev.incorporation,
          jurisdiction: aiBestRec.jurisdiction,
          state: aiBestRec.state,
          companyType: aiBestRec.companyType,
          price: aiBestRec.price,
          packageName: prev.incorporation?.packageName || (displayedPackages.length > 0 ? displayedPackages[Math.floor(displayedPackages.length / 2)].name : undefined),
        } as IncorporationDetails
      }));
    }
  }, [
    orderData.needsAssessment?.region,
    orderData.incorporation?.jurisdiction,
    orderData.incorporation?.state,
    orderData.incorporation?.companyType,
    orderData.incorporation?.price,
    orderData.incorporation?.packageName,
    orderData.incorporation?.aiBestRecommendation,
    updateOrderData,
    displayedPackages,
  ]);

  const handleSelectAiRecommendation = (rec: IncorporationRecommendationItem) => {
    updateOrderData(prev => {
      const newIncorporationDetails: IncorporationDetails = {
        ...prev.incorporation,
        jurisdiction: rec.jurisdiction,
        state: rec.state,
        companyType: rec.companyType,
        price: rec.price,
        packageName: prev.incorporation?.packageName || (displayedPackages.length > 0 ? displayedPackages[Math.floor(displayedPackages.length / 2)].name : undefined),
      };
      return {
        ...prev,
        incorporation: newIncorporationDetails
      };
    });
    setManualConfigAccordionValue(undefined);
    toast({
      title: "Smart Choice!",
      description: `You\'ve selected ${rec.jurisdiction} ${rec.state ? rec.state + ' ' : ''}(${rec.companyType}). An excellent pick based on your needs!`,
    });
    // fetchAndApplyRecommendedAddons(); // Already handled by useEffect on orderData.incorporation change
  };

  const handleManualIncorporationChange = (field: keyof Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType'>, value: string) => {
    let toastTitle = "Got It!";
    let toastDescription = '';
    let fullConfigDone = false;

    updateOrderData(prev => {
      let newIncorporation = { ...(prev.incorporation || {}) } as IncorporationDetails;
      const primaryRegionIsUSAEntry = prev.needsAssessment?.region === 'USA (Exclusive Focus)';
      let changedJurisdiction = newIncorporation.jurisdiction;
      let changedState = newIncorporation.state;
      let changedCompanyType = newIncorporation.companyType;

      if (field === 'jurisdiction') {
        changedJurisdiction = value;
        toastDescription = `Jurisdiction updated to ${value}.`;
        if (value !== 'United States of America') changedState = '';
      } else if (field === 'state') {
        changedState = value;
        toastDescription = `State updated to ${value}.`;
      } else if (field === 'companyType') {
        changedCompanyType = value;
        toastDescription = `Company type updated to ${value}.`;
      }

      newIncorporation.jurisdiction = changedJurisdiction;
      newIncorporation.state = changedState;
      newIncorporation.companyType = changedCompanyType;

      const isCurrentSelectionUSAContext = primaryRegionIsUSAEntry || newIncorporation.jurisdiction === 'United States of America';
      const companyTypesToUse = isCurrentSelectionUSAContext ? US_COMPANY_TYPES_LIST : INTERNATIONAL_COMPANY_TYPES_LIST;
      if (!companyTypesToUse.includes(newIncorporation.companyType || '')) newIncorporation.companyType = '';

      const allFieldsFilledForCustom = newIncorporation.jurisdiction && newIncorporation.companyType && (!isCurrentSelectionUSAContext || (isCurrentSelectionUSAContext && newIncorporation.state));

      if (allFieldsFilledForCustom) {
        newIncorporation.price = assignStaticPriceToManualConfig(newIncorporation.jurisdiction, newIncorporation.state, newIncorporation.companyType);
        if (!newIncorporation.packageName && displayedPackages.length > 0) {
          newIncorporation.packageName = displayedPackages[Math.floor(displayedPackages.length / 2)].name;
        }
        toastTitle = "Custom Setup Complete!";
        toastDescription = `Your tailored incorporation in ${newIncorporation.jurisdiction} ${newIncorporation.state ? newIncorporation.state + ' ' : ''}(${newIncorporation.companyType}) is configured. Price confirmed!`;
        fullConfigDone = true;
      } else {
        newIncorporation.price = undefined;
      }
      return { ...prev, incorporation: newIncorporation };
    });

    if (toastDescription) {
      toast({ title: toastTitle, description: toastDescription });
    }
    // if (fullConfigDone) fetchAndApplyRecommendedAddons(); // Already handled by useEffect
  };

  const handleIncorporationPackageSelect = (packageName: string, packagePrice: number) => {
    updateOrderData(prev => ({
      incorporation: { ...prev.incorporation, packageName: packageName } as IncorporationDetails
    }));
    toast({ title: "Package Added!", description: `The ${packageName} package is now part of your setup. Great benefits ahead!` });
    // fetchAndApplyRecommendedAddons(); // Already handled by useEffect
  };

  const handleAddonToggle = (addonId: string) => {
    let selectedAddonName = '';
    let nowSelected = false;
    updateOrderData(prev => {
      const updatedAddons = (prev.addOns || []).map(addon => {
        if (addon.id === addonId) {
          selectedAddonName = addon.name;
          nowSelected = !addon.selected;
          return { ...addon, selected: !addon.selected };
        }
        return addon;
      });
      return { ...prev, addOns: updatedAddons as AddOn[] };
    });
    toast({
      title: `${nowSelected ? 'Add-on Activated!' : 'Add-on Removed'}`,
      description: `${selectedAddonName} ${nowSelected ? 'is now enhancing your order!' : 'has been taken off your list.'}`,
    });
  };

  const handleAddonInputChange = (addonId: string, field: keyof AddOn, value: string | number | boolean) => {
    updateOrderData(prev => ({
      addOns: (prev.addOns || []).map(addon =>
        addon.id === addonId ? { ...addon, [field]: value } : addon
      ) as AddOn[]
    }));
  };

  const handleProceedToDetails = () => {
    if (!orderData.incorporation?.jurisdiction || !orderData.incorporation.companyType || orderData.incorporation.price === undefined) {
      toast({ title: "Just a Moment!", description: "Please make sure you\'ve chosen your jurisdiction, company type, and a service package to move forward.", variant: "destructive" });
      return;
    }
    setGlobalIsLoading(true);
    startPrefillingTransition(async () => {
      try {
        const prefillInput: PrefillCompanyDetailsInput = {
          userEmail: orderData.userEmail || '',
          userPhone: orderData.userPhone || '',
          businessPurpose: (orderData.needsAssessment?.businessActivities || []).join(', '),
          businessDescription: orderData.needsAssessment?.businessDescription || '',
          selectedJurisdiction: orderData.incorporation?.jurisdiction || '',
          selectedCompanyType: orderData.incorporation?.companyType || '',
          selectedState: orderData.incorporation?.state,
        };
        const prefilledData = await prefillCompanyDetails(prefillInput);
        updateOrderData(prev => ({
          ...prev,
          companyNames: prefilledData.suggestedCompanyNames ? {
            firstChoice: prefilledData.suggestedCompanyNames.firstChoice || prev.companyNames?.firstChoice,
            secondChoice: prefilledData.suggestedCompanyNames.secondChoice || prev.companyNames?.secondChoice,
            thirdChoice: prefilledData.suggestedCompanyNames.thirdChoice || prev.companyNames?.thirdChoice,
          } : prev.companyNames,
        }));
        toast({ title: "Smart Start!", description: "We've fast-tracked your setup by pre-filling some company details. Let's review and finalize them." });
        goToNextStep();
      } catch (error) {
        console.error("Error prefilling details:", error);
        toast({ title: "Manual Entry", description: "No worries! We couldn't prefill all details this time. Please proceed to enter them manually in the next step.", variant: null });
        goToNextStep();
      } finally {
        setGlobalIsLoading(false);
      }
    });
  };

  const isProceedButtonDisabled = isGlobalLoading || isPrefilling || isRecommendAddonsLoading ||
    !orderData.incorporation?.jurisdiction ||
    !orderData.incorporation?.companyType ||
    ((isPrimaryRegionUSA || orderData.incorporation?.jurisdiction === 'United States of America') && !orderData.incorporation?.state) ||
    orderData.incorporation.price === undefined ||
    !orderData.incorporation.packageName;

  const allAiRecommendations = useMemo(() => {
    const recommendations: IncorporationRecommendationItem[] = [];
    if (orderData.incorporation?.aiBestRecommendation) recommendations.push({ ...orderData.incorporation.aiBestRecommendation, isBestPick: true });
    if (orderData.incorporation?.aiAlternativeRecommendations) recommendations.push(...orderData.incorporation.aiAlternativeRecommendations.map(alt => ({ ...alt, isBestPick: false })).slice(0, 3));
    return recommendations.filter(Boolean);
  }, [orderData.incorporation?.aiBestRecommendation, orderData.incorporation?.aiAlternativeRecommendations]);

  const renderRecommendationCard = (rec: IncorporationRecommendationItem, isBest: boolean) => {
    const key = `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`;
    const isSelected = selectedIncorporationKey === key;
    let title = `${rec.jurisdiction} - ${rec.companyType}`;
    if (rec.jurisdiction === 'United States of America' && rec.state) {
      const stateLabel = US_STATES_LIST.find(s => s.value === rec.state)?.label || rec.state.split('-')[0];
      title = `${stateLabel} (USA) - ${rec.companyType}`;
    }
    return (
      <Card key={key} onClick={() => handleSelectAiRecommendation(rec)}
        className={cn("cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl overflow-hidden relative flex flex-col group", isSelected ? "ring-2 ring-primary shadow-lg border-primary" : "border-border hover:border-primary/70", isBest ? "md:col-span-3 p-6" : "md:col-span-1 p-4")}>
        <CardHeader className={cn("pb-2 pt-0 px-0 flex-row justify-between items-start", isBest ? "mb-2" : "mb-1")}>
          <CardTitle className={cn("leading-tight", isBest ? "text-xl md:text-2xl" : "text-lg")}>{title}</CardTitle>
          {rec.isBestPick && <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground">Our Top Pick</Badge>}
        </CardHeader>
        <CardContent className={cn("space-y-2 flex-grow px-0", isBest ? "pb-16" : "pb-12")}>
          <p className="italic text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: `${(rec.reasoning || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}` }} />
          <div className={cn("absolute bottom-3 right-3 font-bold text-primary", isBest ? "text-xl" : "text-lg")}>From ${rec.price}</div>
        </CardContent>
      </Card>
    );
  };
  const packageSectionTitle = isPrimaryRegionUSA ? "Select Incorporation Package" : "Select Processing Time";
  const openAccordionItemsForAddons = useMemo(() => (orderData.addOns || []).filter(a => a.selected).map(a => a.id), [orderData.addOns]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Select Your Incorporation Services</h2>
      <p className="text-muted-foreground">{recommendationIntroText}</p>

      {allAiRecommendations.length > 0 && (
        <div className="py-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allAiRecommendations.map(rec => renderRecommendationCard(rec, rec.isBestPick || false))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Accordion type="single" collapsible className="w-full" value={manualConfigAccordionValue} onValueChange={setManualConfigAccordionValue}>
          <AccordionItem value="manual-config" className="border-b-0">
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                asChild
                className="w-full"
              >
                <div className="group p-3 hover:no-underline flex justify-between items-center w-full text-base font-medium cursor-pointer text-muted-foreground data-[state=open]:text-primary data-[state=open]:font-semibold">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Customize Your Incorporation</span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="pt-2 pb-4 space-y-4 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <p className="text-sm text-muted-foreground">Fine-tune your selection or choose a different combination.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4 items-end">
                {!isPrimaryRegionUSA && (
                  <div className="md:col-span-1">
                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                    <Select
                      value={orderData.incorporation?.jurisdiction || ''}
                      onValueChange={(value) => handleManualIncorporationChange('jurisdiction', value)}
                    >
                      <SelectTrigger id="jurisdiction" className="w-full mt-1"><SelectValue placeholder="Select Jurisdiction" /></SelectTrigger>
                      <SelectContent>{JURISDICTIONS_LIST.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                {(isPrimaryRegionUSA || orderData.incorporation?.jurisdiction === 'United States of America') && (
                  <div className="md:col-span-1">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={orderData.incorporation?.state || ''}
                      onValueChange={(value) => handleManualIncorporationChange('state', value)}
                      disabled={!isPrimaryRegionUSA && orderData.incorporation?.jurisdiction !== 'United States of America'}
                    >
                      <SelectTrigger id="state" className="w-full mt-1"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>{US_STATES_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                <div className={cn("md:col-span-1", isPrimaryRegionUSA && orderData.incorporation?.jurisdiction === 'United States of America' ? "" : (orderData.incorporation?.jurisdiction ? "" : "md:col-span-2"))}>
                  <Label htmlFor="companyType">Company Type</Label>
                  <Select
                    value={orderData.incorporation?.companyType || ''}
                    onValueChange={(value) => handleManualIncorporationChange('companyType', value)}
                    disabled={
                      (!orderData.incorporation?.jurisdiction) ||
                      ((isPrimaryRegionUSA || orderData.incorporation?.jurisdiction === 'United States of America') && !orderData.incorporation?.state)}
                  >
                    <SelectTrigger id="companyType" className="w-full mt-1"><SelectValue placeholder="Select Company Type" /></SelectTrigger>
                    <SelectContent>{currentCompanyTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {orderData.incorporation?.price !== undefined && orderData.incorporation?.jurisdiction && orderData.incorporation.companyType && (isPrimaryRegionUSA || orderData.incorporation.jurisdiction === 'United States of America' ? orderData.incorporation.state : true) && (
                  <div className="text-primary font-semibold text-lg md:col-span-2 md:text-right">
                    Base Price: ${orderData.incorporation.price}
                  </div>
                )}
              </div>
            </AccordionPrimitive.Content>
          </AccordionItem>
        </Accordion>
      </div>

      {orderData.incorporation?.jurisdiction && (
        <div className="py-4 space-y-3">
          <div className="flex items-center space-x-2 mb-1"><Package className="h-5 w-5 text-primary" /><h3 className="text-xl font-semibold">{packageSectionTitle}</h3></div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPackages.map(pkg => (
              <Label key={pkg.name} htmlFor={`package-${pkg.name.replace(/\s+/g, '-')}`} onClick={() => handleIncorporationPackageSelect(pkg.name, pkg.price)}
                className={cn("flex flex-col items-start cursor-pointer rounded-lg border p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl", orderData.incorporation?.packageName === pkg.name ? 'border-primary ring-2 ring-primary shadow-md' : 'bg-card border-border hover:border-primary/70')}>
                <div className="flex items-center w-full"><span className="font-semibold">{pkg.name} - ${pkg.price}</span></div>
                <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground space-y-1">{pkg.features.map(f => <li key={f}>{f}</li>)}</ul>
              </Label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Tailor Your Setup with Add-ons</h3>
          {isRecommendAddonsLoading && <Loader2 className="h-5 w-5 ml-2 animate-spin text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground flex items-center">
          {addonRecommendationIntro.includes("Based on your choices") && <Sparkles className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0" />}
          {addonRecommendationIntro}
        </p>

        <Accordion type="multiple" className="w-full space-y-2" value={openAccordionItemsForAddons}>
          {(orderData.addOns || []).map(addon => (
            <AccordionItem key={addon.id} value={addon.id} className="border rounded-md overflow-hidden data-[state=open]:border-primary data-[state=open]:ring-1 data-[state=open]:ring-primary">
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  asChild
                  onClick={() => handleAddonToggle(addon.id)}
                  className="w-full"
                >
                  <div className="group p-3 hover:no-underline flex justify-between items-center w-full text-base font-medium cursor-pointer data-[state=open]:bg-muted/30">
                    <div className="flex items-center mr-auto text-left">
                      {addon.selected && <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0" />}
                      {!addon.selected && <span className="h-5 w-5 mr-2 flex-shrink-0" />}
                      <span className={cn("font-semibold group-hover:text-primary", addon.selected && "text-primary")}>{addon.name}</span>
                    </div>
                    <div className="flex items-center shrink-0 ml-3">
                      <span className={cn("text-sm mr-3", addon.selected ? "text-primary font-semibold" : "text-muted-foreground")}>From ${addon.price}</span>
                      <Switch id={`addon-switch-${addon.id}`} checked={addon.selected} aria-hidden="true" className="pointer-events-none" />
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-2" />
                    </div>
                  </div>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="p-4 pt-2 space-y-3 bg-muted/10">
                <p className="text-sm text-muted-foreground">{addon.description}</p>
                {addon.recommendationReasoning && (
                  <p className="text-xs italic text-primary bg-primary/10 p-2 rounded-md flex items-center">
                    <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" /> {addon.recommendationReasoning}
                  </p>
                )}
                {addon.requiresDetails && addon.id === 'banking_assistance' && (
                  <div className="mt-2 p-3 bg-background border rounded-md text-sm space-y-2">
                    <p className="font-medium mb-1">Banking Preferences (Optional):</p>
                    <div>
                      <Label htmlFor={`bank-currency-${addon.id}`} className="text-xs">Preferred Currency:</Label>
                      <Input id={`bank-currency-${addon.id}`} placeholder="e.g., USD, EUR" className="mt-1 text-xs h-8" value={addon.preferredCurrency || ''} onChange={(e) => handleAddonInputChange(addon.id, 'preferredCurrency', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor={`bank-region-${addon.id}`} className="text-xs">Preferred Banking Region:</Label>
                      <Input id={`bank-region-${addon.id}`} placeholder="e.g., Singapore, Switzerland" className="mt-1 text-xs h-8" value={addon.preferredBankingRegion || ''} onChange={(e) => handleAddonInputChange(addon.id, 'preferredBankingRegion', e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Note: Our team will contact you to discuss specific bank options.</p>
                  </div>
                )}
                {addon.requiresDetails && addon.id === 'virtual_office' && (
                  <div className="mt-2 p-3 bg-background border rounded-md text-sm space-y-2">
                    <p className="font-medium mb-1">Virtual Office Setup (Optional):</p>
                    <div>
                      <Label htmlFor={`vo-forwarding-${addon.id}`} className="text-xs">Mail Forwarding Preference:</Label>
                      <Select value={addon.mailForwardingPreference || 'none'} onValueChange={(val) => handleAddonInputChange(addon.id, 'mailForwardingPreference', val)}>
                        <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Select Preference" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Specific Preference</SelectItem>
                          <SelectItem value="scan_email">Scan & Email</SelectItem>
                          <SelectItem value="physical_monthly">Physical (Monthly)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {addon.requiresDetails && addon.id === 'trademark_registration' && (
                  <div className="mt-2 p-3 bg-background border rounded-md text-sm space-y-2">
                    <p className="font-medium mb-1">Trademark Details (Optional):</p>
                    <div>
                      <Label htmlFor={`tm-name-${addon.id}`} className="text-xs">Trademark/Brand Name:</Label>
                      <Input id={`tm-name-${addon.id}`} placeholder="e.g., My Awesome Brand" className="mt-1 text-xs h-8" value={addon.trademarkName || ''} onChange={(e) => handleAddonInputChange(addon.id, 'trademarkName', e.target.value)} />
                    </div>
                  </div>
                )}
              </AccordionPrimitive.Content>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={goToPrevStep} disabled={isGlobalLoading || isPrefilling || isRecommendAddonsLoading}> <ChevronLeft className="mr-2 h-4 w-4" /> Edit Needs</Button>
        <Button onClick={handleProceedToDetails} disabled={isProceedButtonDisabled}> {(isGlobalLoading || isPrefilling || isRecommendAddonsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Provide Details <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default Step2SelectServices;
