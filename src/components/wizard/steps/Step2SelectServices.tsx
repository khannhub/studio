
'use client';

import type { FC } from 'react';
import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import type { StepComponentProps, IncorporationRecommendationItem, IncorporationDetails, OrderData } from '@/lib/types';
import { JURISDICTIONS_LIST, US_STATES_LIST, US_COMPANY_TYPES_LIST, INTERNATIONAL_COMPANY_TYPES_LIST, CUSTOM_INCORP_BASE_PRICE } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wand2, ChevronRight, ChevronLeft, Package, ShoppingBag, Settings, Loader2, MapPin, Briefcase, Building, DollarSign, Info, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { prefillCompanyDetails, type PrefillCompanyDetailsInput, type PrefillCompanyDetailsOutput } from '@/ai/flows/prefill-company-details';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// Fixed prices for USA packages
export const incorporationPackages = [
  { name: 'Premium', price: 700, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
  { name: 'Standard', price: 450, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Basic', price: 200, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
].sort((a,b) => b.price - a.price); // Sort by descending price

// Fixed prices for International processing times
export const processingTimePackages = [
  { name: 'Super Urgent', price: 450, features: ['Processing within 30 mins - 4 hours', 'Dedicated Support Line', 'Digital & Physical Docs Priority'] },
  { name: 'Express', price: 250, features: ['Processing within 1/2 working day', 'Priority Support', 'Digital Docs First'] },
  { name: 'Normal', price: 0, features: ['Processing within 1 working day', 'Standard Support', 'Standard Document Delivery'] },
].sort((a,b) => b.price - a.price); // Sort by descending price

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
  
  const [openAddonAccordionItems, setOpenAddonAccordionItems] = useState<string[]>([]);
  const [isPrefilling, startPrefillingTransition] = useTransition();
  
  const recommendationIntroText = orderData.incorporation?.aiGeneratedIntroText || "Here are some incorporation options based on your stated needs and objectives.";

  const displayedPackages = useMemo(() => {
    return isPrimaryRegionUSA ? incorporationPackages : processingTimePackages;
  }, [isPrimaryRegionUSA]);


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
        currentJurisdiction && 
        currentCompanyType && 
        currentPrice !== undefined &&
        ((primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') ? !!currentState : true);

    if (hasValidIncorporationSelection) {
        const key = `${currentJurisdiction}-${currentState || 'none'}-${currentCompanyType}`;
        setSelectedIncorporationKey(key);
         if (!currentPackageName && displayedPackages.length > 0) {
             updateOrderData(prev => ({
                incorporation: {
                    ...prev.incorporation,
                    packageName: displayedPackages[Math.floor(displayedPackages.length / 2)].name, // Default to middle package
                } as IncorporationDetails
            }));
        }
    } else if (aiBestRec && !currentJurisdiction && !currentState && !currentCompanyType ) { 
        // If no user selection but AI best pick exists, apply it
        updateOrderData(prev => ({
            incorporation: {
                ...prev.incorporation,
                jurisdiction: aiBestRec.jurisdiction,
                state: aiBestRec.state,
                companyType: aiBestRec.companyType,
                price: aiBestRec.price, // This is now the static price assigned in Step 1
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
          price: rec.price, // Use static price from recommendation
          packageName: prev.incorporation?.packageName || (displayedPackages.length > 0 ? displayedPackages[Math.floor(displayedPackages.length / 2)].name : undefined),
      };
      return {
          ...prev,
          incorporation: newIncorporationDetails
      };
    });
    setManualConfigAccordionValue(undefined); 
  };


  const handleManualIncorporationChange = (field: keyof Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType'>, value: string) => {
    updateOrderData(prev => {
        let newIncorporation = { ...(prev.incorporation || {}) } as IncorporationDetails;
        const primaryRegionIsUSAEntry = prev.needsAssessment?.region === 'USA (Exclusive Focus)';

        let changedJurisdiction = newIncorporation.jurisdiction;
        let changedState = newIncorporation.state;
        let changedCompanyType = newIncorporation.companyType;

        if (field === 'jurisdiction') {
            changedJurisdiction = value;
            if (value !== 'United States of America') {
                changedState = ''; 
            }
        } else if (field === 'state') {
            changedState = value;
        } else if (field === 'companyType') {
            changedCompanyType = value;
        }
        
        newIncorporation.jurisdiction = changedJurisdiction;
        newIncorporation.state = changedState;
        newIncorporation.companyType = changedCompanyType;

        const isCurrentSelectionUSAContext = primaryRegionIsUSAEntry || newIncorporation.jurisdiction === 'United States of America';
        const companyTypesToUse = isCurrentSelectionUSAContext ? US_COMPANY_TYPES_LIST : INTERNATIONAL_COMPANY_TYPES_LIST;
        if (!companyTypesToUse.includes(newIncorporation.companyType || '')) {
            newIncorporation.companyType = ''; 
        }

        const allFieldsFilledForCustom = newIncorporation.jurisdiction && newIncorporation.companyType && (!isCurrentSelectionUSAContext || (isCurrentSelectionUSAContext && newIncorporation.state));

        if (allFieldsFilledForCustom) {
            newIncorporation.price = assignStaticPriceToManualConfig(newIncorporation.jurisdiction, newIncorporation.state, newIncorporation.companyType);
            if (!newIncorporation.packageName && displayedPackages.length > 0) {
                newIncorporation.packageName = displayedPackages[Math.floor(displayedPackages.length / 2)].name;
            }
        } else {
            newIncorporation.price = undefined; 
        }
        
        return { ...prev, incorporation: newIncorporation };
    });
  };

  const handleIncorporationPackageSelect = (packageName: string) => {
    updateOrderData(prev => ({
      incorporation: {
        ...prev.incorporation,
        packageName: packageName,
      } as IncorporationDetails
    }));
  };

  const handleAddonToggle = (addonId: string, selected: boolean) => {
    updateOrderData(prev => ({
        addOns: (prev.addOns || []).map(addon =>
            addon.id === addonId ? { ...addon, selected } : addon
        )
    }));
    setOpenAddonAccordionItems(prevOpen => {
      if (selected && !prevOpen.includes(addonId)) {
        return [...prevOpen, addonId];
      } else if (!selected && prevOpen.includes(addonId)) {
        return prevOpen.filter(id => id !== addonId);
      }
      return prevOpen;
    });
  };
  
  const handleAddonInputChange = (addonId: string, field: keyof OrderData['addOns'][number], value: string) => {
    updateOrderData(prev => ({
      addOns: (prev.addOns || []).map(addon =>
        addon.id === addonId ? { ...addon, [field]: value } : addon
      )
    }));
  };


  const handleProceedToDetails = () => {
    setGlobalIsLoading(true);
    startPrefillingTransition(async () => {
      try {
        const prefillInput: PrefillCompanyDetailsInput = {
          userEmail: orderData.userEmail || '',
          userPhone: orderData.userPhone || '',
          businessPurpose: (orderData.needsAssessment?.businessActivities || []).join(', '),
          businessDescription: orderData.needsAssessment?.businessDescription || '',
          selectedJurisdiction: orderData.incorporation?.jurisdiction || '',
          selectedState: orderData.incorporation?.state || '',
          selectedCompanyType: orderData.incorporation?.companyType || '',
        };
        const suggestions: PrefillCompanyDetailsOutput = await prefillCompanyDetails(prefillInput);

        updateOrderData(prev => ({
          ...prev,
          companyNames: suggestions.suggestedCompanyNames,
          directors: prev.directors && prev.directors.length > 0 && prev.directors[0].fullName && prev.directors[0].email 
            ? prev.directors.map((dir, idx) => idx === 0 && (!dir.fullName || !dir.email) ? { ...dir, fullName: suggestions.suggestedDirector.fullName, email: suggestions.suggestedDirector.email } : dir)
            : [{ id: `dir-${Date.now()}`, fullName: suggestions.suggestedDirector.fullName, email: suggestions.suggestedDirector.email }],
          primaryContact: {
            id: prev.primaryContact?.id || `contact-${Date.now()}`,
            fullName: suggestions.suggestedPrimaryContact.fullName,
            email: suggestions.suggestedPrimaryContact.email,
            phone: suggestions.suggestedPrimaryContact.phone,
          }
        }));

        toast({ title: "Details Suggested", description: "We've suggested some details for Step 3 based on your input." });
      } catch (error) {
        console.error("Error pre-filling details:", error);
        toast({ title: "Suggestion Error", description: "Could not pre-fill details. Please enter them manually.", variant: "destructive" });
      } finally {
        setGlobalIsLoading(false);
        goToNextStep();
      }
    });
  };

  const isProceedButtonDisabled = isGlobalLoading || isPrefilling ||
    !orderData.incorporation?.jurisdiction ||
    !orderData.incorporation?.companyType ||
    ((isPrimaryRegionUSA || orderData.incorporation?.jurisdiction === 'United States of America') && !orderData.incorporation?.state) || 
    orderData.incorporation.price === undefined || 
    !orderData.incorporation.packageName;

  const allAiRecommendations = useMemo(() => {
    const recommendations: IncorporationRecommendationItem[] = [];
    if (orderData.incorporation?.aiBestRecommendation) {
        recommendations.push({ ...orderData.incorporation.aiBestRecommendation, isBestPick: true });
    }
    if (orderData.incorporation?.aiAlternativeRecommendations) {
        recommendations.push(...orderData.incorporation.aiAlternativeRecommendations.map(alt => ({...alt, isBestPick: false})).slice(0,3));
    }
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
        <Card
            key={key}
            onClick={() => handleSelectAiRecommendation(rec)}
            className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl overflow-hidden relative flex flex-col group",
                isSelected ? "ring-2 ring-primary shadow-lg border-primary" : "border-border hover:border-primary/70",
                isBest ? "md:col-span-3 p-6" : "md:col-span-1 p-4" 
            )}
        >
            <CardHeader className={cn("pb-2 pt-0 px-0 flex-row justify-between items-start", isBest ? "mb-2" : "mb-1")}>
                <CardTitle className={cn("leading-tight", isBest ? "text-xl md:text-2xl" : "text-lg")}> 
                    {title}
                </CardTitle>
                {rec.isBestPick && <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground">Our Top Pick</Badge>}
            </CardHeader>
            <CardContent className={cn("space-y-2 flex-grow px-0", isBest ? "pb-16" : "pb-12")}>
                <p className="italic text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: `${(rec.reasoning || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}` }} />
                 <div className={cn(
                    "absolute bottom-3 right-3 font-bold text-primary",
                    isBest ? "text-xl" : "text-lg" 
                )}>
                    From ${rec.price}
                </div>
            </CardContent>
        </Card>
    );
  };

  const packageSectionTitle = isPrimaryRegionUSA ? "Select Incorporation Package" : "Select Processing Time";

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
        
        <div className="space-y-3 pt-2"> {/* No border-b for accordion */}
            <Accordion type="single" collapsible className="w-full" value={manualConfigAccordionValue} onValueChange={setManualConfigAccordionValue}>
                <AccordionItem value="manual-config" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-3 text-base font-medium text-muted-foreground data-[state=open]:text-primary data-[state=open]:font-semibold">
                        <div className="flex items-center space-x-2 w-full">
                            <Settings className="h-5 w-5"/>
                            <span>Customize Your Incorporation</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4">
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
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
        
        {orderData.incorporation?.jurisdiction && (
            <div className="py-4 space-y-3">
                <div className="flex items-center space-x-2 mb-1">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">{packageSectionTitle}</h3>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedPackages.map(pkg => (
                        <Label
                            key={pkg.name}
                            htmlFor={`package-${pkg.name.replace(/\s+/g, '-')}`}
                            onClick={() => handleIncorporationPackageSelect(pkg.name)}
                            className={cn(
                                "flex flex-col items-start cursor-pointer rounded-lg border p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl",
                                orderData.incorporation?.packageName === pkg.name ? 'border-primary ring-2 ring-primary shadow-md' : 'bg-card border-border hover:border-primary/70'
                            )}
                        >
                        <div className="flex items-center w-full">
                            <span className="font-semibold">{pkg.name} - ${pkg.price}</span>
                        </div>
                        <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {pkg.features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                        </Label>
                    ))}
                </div>
            </div>
        )}


        <div className="space-y-3 py-4">
            <div className="flex items-center space-x-2 mb-1">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Popular Add-ons</h3>
            </div>
            <p className="text-sm text-muted-foreground">Consider these popular services for your new company.</p>
            <Accordion type="multiple" className="w-full space-y-2" value={openAddonAccordionItems} onValueChange={setOpenAddonAccordionItems}>
                {(orderData.addOns || []).map(addon => (
                <AccordionItem key={addon.id} value={addon.id} className="border rounded-md overflow-hidden">
                     <AccordionTrigger className="p-4 hover:no-underline flex justify-between items-center w-full text-base font-medium">
                        <span className="mr-auto text-left">{addon.name}</span>
                         <div className="flex items-center shrink-0 ml-2">
                            <span className="text-primary font-semibold mr-3">From ${addon.price}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 space-y-3">
                        {addon.description && <p className="text-sm text-muted-foreground">{addon.description}</p>}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`addon-switch-${addon.id}`}
                                checked={addon.selected}
                                onCheckedChange={(checked) => handleAddonToggle(addon.id, checked)}
                            />
                            <Label htmlFor={`addon-switch-${addon.id}`}>
                                {addon.selected ? "Selected" : "Select this add-on"}
                            </Label>
                        </div>
                         {addon.selected && addon.id === 'banking_assistance' && ( 
                            <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm space-y-2">
                                <p className="font-medium mb-1">Banking Preferences (Optional):</p>
                                <div>
                                  <Label htmlFor={`bank-currency-${addon.id}`} className="text-xs">Preferred Currency:</Label>
                                  <Input id={`bank-currency-${addon.id}`} placeholder="e.g., USD, EUR" className="mt-1 text-xs h-8" 
                                   value={addon.preferredCurrency || ''}
                                   onChange={(e) => handleAddonInputChange(addon.id, 'preferredCurrency', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`bank-region-${addon.id}`} className="text-xs">Preferred Banking Region:</Label>
                                  <Input id={`bank-region-${addon.id}`} placeholder="e.g., Singapore, Switzerland" className="mt-1 text-xs h-8" 
                                    value={addon.preferredBankingRegion || ''}
                                    onChange={(e) => handleAddonInputChange(addon.id, 'preferredBankingRegion', e.target.value)}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Note: Our team will contact you to discuss specific bank options based on your incorporation.</p>
                            </div>
                        )}
                         {addon.selected && addon.id !== 'banking_assistance' && (
                            <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                <p className="text-xs text-muted-foreground">Additional details for {addon.name} can be configured upon request or during consultation.</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button variant="outline" onClick={goToPrevStep} disabled={isGlobalLoading || isPrefilling}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Edit Needs
            </Button>
            <Button onClick={handleProceedToDetails} disabled={isProceedButtonDisabled}>
              {(isGlobalLoading || isPrefilling) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Provide Details <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
  );
};

export default Step2SelectServices;
