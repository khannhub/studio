
'use client';

import type { FC } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { StepComponentProps, IncorporationRecommendationItem, IncorporationDetails, AddOn } from '@/lib/types';
import { JURISDICTIONS_LIST, US_STATES_LIST, US_COMPANY_TYPES_LIST, INTERNATIONAL_COMPANY_TYPES_LIST, INITIAL_ADDONS, CUSTOM_INCORP_BASE_PRICE } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Package, ShoppingBag, Building, Info, Settings, Loader2, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { prefillCompanyDetails, type PrefillCompanyDetailsInput, type PrefillCompanyDetailsOutput } from '@/ai/flows/prefill-company-details';

// For USA (Exclusive Focus)
export const incorporationPackages = [ 
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
];

// For other regions - updated prices and features
export const processingTimePackages = [ 
  { name: 'Super Urgent', price: 450, features: ['Processing within 30 mins - 4 hours', 'Dedicated Support Line', 'Digital & Physical Docs Priority'] },
  { name: 'Express', price: 250, features: ['Processing within 1/2 working day', 'Priority Support', 'Digital Docs First'] },
  { name: 'Normal', price: 0, features: ['Processing within 1 working day', 'Standard Support', 'Standard Document Delivery'] },
];


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
  const [packageSectionAccordionValue, setPackageSectionAccordionValue] = useState<string | undefined>(undefined);
  const [isPrefilling, startPrefillingTransition] = useTransition();
  const [openAddonAccordionItems, setOpenAddonAccordionItems] = useState<string[]>([]);


  const allAiRecommendations = useMemo(() => {
    const recommendations: IncorporationRecommendationItem[] = [];
    if (orderData.incorporation?.aiBestRecommendation) {
        recommendations.push({ ...orderData.incorporation.aiBestRecommendation, isBestPick: true });
    }
    if (orderData.incorporation?.aiAlternativeRecommendations) {
        recommendations.push(...orderData.incorporation.aiAlternativeRecommendations.map(alt => ({...alt, isBestPick: false})).slice(0,3));
    }
    return recommendations.filter(Boolean);
  }, [orderData.incorporation]);

  const displayedPackages = useMemo(() => {
    return isPrimaryRegionUSA ? incorporationPackages : processingTimePackages;
  }, [isPrimaryRegionUSA]);

  useEffect(() => {
    const primaryRegionIsUSAEntry = orderData.needsAssessment?.region === 'USA (Exclusive Focus)';
    setIsPrimaryRegionUSA(primaryRegionIsUSAEntry);

    const currentJurisdiction = orderData.incorporation?.jurisdiction;
    const currentState = orderData.incorporation?.state;
    const currentCompanyType = orderData.incorporation?.companyType;

    let activeCompanyTypes = INTERNATIONAL_COMPANY_TYPES_LIST;
    if (primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') {
        activeCompanyTypes = US_COMPANY_TYPES_LIST;
        if (currentJurisdiction && !US_COMPANY_TYPES_LIST.includes(currentCompanyType || '')) {
            // updateOrderData(prev => ({ incorporation: { ...prev.incorporation, companyType: '' }})); // Handled in handleManualIncorporationChange
        }
    } else if (currentJurisdiction && currentJurisdiction !== 'United States of America') {
        if (!INTERNATIONAL_COMPANY_TYPES_LIST.includes(currentCompanyType || '')) {
            //  updateOrderData(prev => ({ incorporation: { ...prev.incorporation, companyType: '' }})); // Handled in handleManualIncorporationChange
        }
    }
    setCurrentCompanyTypes(activeCompanyTypes);

    const hasValidIncorporationSelection = currentJurisdiction && currentCompanyType && ( (primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') ? currentState : true );

    if (hasValidIncorporationSelection) {
        const key = `${currentJurisdiction}-${currentState || 'none'}-${currentCompanyType}`;
        setSelectedIncorporationKey(key);
        setPackageSectionAccordionValue("package-selection-item"); 

        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === key
        );

        if (matchingAiRec && orderData.incorporation?.price !== matchingAiRec.price) {
             updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: matchingAiRec.price }
            }));
        } else if (!matchingAiRec && orderData.incorporation?.price === undefined) { // Custom selection
            updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: CUSTOM_INCORP_BASE_PRICE }
            }));
        }
         
        if (!orderData.incorporation?.packageName && displayedPackages.length > 0) {
            const middlePackageIndex = Math.floor(displayedPackages.length / 2);
            updateOrderData(prev => ({
            incorporation: {
                ...prev.incorporation,
                packageName: displayedPackages[middlePackageIndex].name,
            }
            }));
        }

    } else if (orderData.incorporation?.aiBestRecommendation && !orderData.incorporation.jurisdiction) { 
        const bestRec = orderData.incorporation.aiBestRecommendation;
        updateOrderData(prev => ({
            incorporation: {
                ...prev.incorporation,
                jurisdiction: bestRec.jurisdiction,
                state: bestRec.state,
                companyType: bestRec.companyType,
                price: bestRec.price,
            }
        }));
        setSelectedIncorporationKey(`${bestRec.jurisdiction}-${bestRec.state || 'none'}-${bestRec.companyType}`);
        setPackageSectionAccordionValue("package-selection-item"); 
        
        if (!orderData.incorporation?.packageName && displayedPackages.length > 0) {
            const middlePackageIndex = Math.floor(displayedPackages.length / 2);
            updateOrderData(prev => ({
            incorporation: {
                ...prev.incorporation,
                packageName: displayedPackages[middlePackageIndex].name,
            }
            }));
        }
    }
  }, [
    orderData.needsAssessment?.region,
    orderData.incorporation?.jurisdiction,
    orderData.incorporation?.companyType,
    orderData.incorporation?.state,
    orderData.incorporation?.price,
    orderData.incorporation?.aiBestRecommendation,
    orderData.incorporation?.packageName,
    updateOrderData,
    allAiRecommendations,
    displayedPackages
  ]);


  useEffect(() => {
    if (!orderData.addOns || orderData.addOns.length === 0) {
      updateOrderData({ addOns: INITIAL_ADDONS.map(addon => ({ ...addon, selected: false })) });
    }
  }, [orderData.addOns, updateOrderData]);


  const handleSelectAiRecommendation = (rec: IncorporationRecommendationItem) => {
    updateOrderData(prev => ({
        incorporation: {
            ...prev.incorporation, 
            jurisdiction: rec.jurisdiction,
            state: rec.state,
            companyType: rec.companyType,
            price: rec.price,
            packageName: prev.incorporation?.packageName || displayedPackages[Math.floor(displayedPackages.length / 2)]?.name,
        }
    }));
    setSelectedIncorporationKey(`${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`);
    setManualConfigAccordionValue(undefined); 
    setPackageSectionAccordionValue("package-selection-item"); 
  };

  const handleManualIncorporationChange = (field: keyof Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType'>, value: string) => {
    updateOrderData(prev => {
        let newIncorporation = { ...prev.incorporation } as IncorporationDetails;
        
        if (field === 'jurisdiction') {
            newIncorporation.jurisdiction = value;
            const newPrimaryRegionIsUSAContext = value === 'United States of America';
            
            if (newPrimaryRegionIsUSAContext) {
                setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
                if (!US_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = '';
                }
            } else {
                setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
                newIncorporation.state = ''; 
                if (!INTERNATIONAL_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = '';
                }
            }
        } else if (field === 'state') {
            newIncorporation.state = value;
            setCurrentCompanyTypes(US_COMPANY_TYPES_LIST); // Assuming state is only for USA
            if (!US_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                newIncorporation.companyType = '';
            }
        } else if (field === 'companyType') {
            newIncorporation.companyType = value;
        }

        const manualSelectionKey = `${newIncorporation.jurisdiction}-${newIncorporation.state || 'none'}-${newIncorporation.companyType}`;
        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === manualSelectionKey
        );

        const isCurrentSelectionUSAContext = isPrimaryRegionUSA || newIncorporation.jurisdiction === 'United States of America';
        const allFieldsFilledForCustom = newIncorporation.jurisdiction && newIncorporation.companyType && (!isCurrentSelectionUSAContext || (isCurrentSelectionUSAContext && newIncorporation.state));


        if (matchingAiRec) {
            newIncorporation.price = matchingAiRec.price;
            setSelectedIncorporationKey(manualSelectionKey);
        } else if (allFieldsFilledForCustom) {
            newIncorporation.price = CUSTOM_INCORP_BASE_PRICE; // Nominal starting for custom
            setSelectedIncorporationKey(null); // Deselect AI cards if manual config doesn't match
        } else {
            newIncorporation.price = undefined; // Not enough info for a price
            setSelectedIncorporationKey(null);
        }
        
        if (allFieldsFilledForCustom) {
            setPackageSectionAccordionValue("package-selection-item");
            if (!newIncorporation.packageName && displayedPackages.length > 0) {
                const middlePackageIndex = Math.floor(displayedPackages.length / 2);
                newIncorporation.packageName = displayedPackages[middlePackageIndex].name;
            }
        } else {
            setPackageSectionAccordionValue(undefined); 
        }

        return { incorporation: newIncorporation };
    });
  };

  const handleIncorporationPackageSelect = (packageName: string) => {
    updateOrderData(prev => ({
      incorporation: {
        ...prev.incorporation,
        packageName: packageName,
      }
    }));
  };

  const handleAddonToggle = (addonId: string, selected: boolean) => {
    const updatedAddons = (orderData.addOns || INITIAL_ADDONS).map(addon =>
      addon.id === addonId ? { ...addon, selected } : addon
    );
    updateOrderData({ addOns: updatedAddons });
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
          directors: prev.directors && prev.directors.length > 0 && prev.directors[0].fullName // only update if first director is empty
            ? prev.directors.map((dir, idx) => idx === 0 && !dir.fullName ? { ...dir, fullName: suggestions.suggestedDirector.fullName, email: suggestions.suggestedDirector.email } : dir)
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

  const bestRec = orderData.incorporation?.aiBestRecommendation;
  const altRecs = orderData.incorporation?.aiAlternativeRecommendations || [];

  const packageSectionTitle = isPrimaryRegionUSA ? "Select Incorporation Package" : "Select Processing Time";


  const renderRecommendationCard = (rec: IncorporationRecommendationItem, isBest: boolean) => {
    const key = `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`;
    const isSelected = selectedIncorporationKey === key;
    const stateLabel = rec.state ? US_STATES_LIST.find(s => s.value === rec.state)?.label || rec.state.split('-')[0] : '';

    return (
        <Card
            key={key}
            onClick={() => handleSelectAiRecommendation(rec)}
            className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl overflow-hidden relative flex flex-col",
                isSelected ? "ring-2 ring-primary shadow-lg border-primary" : "border-border hover:border-primary/70",
                isBest ? "md:col-span-3" : "md:col-span-1"
            )}
        >
            <CardHeader className={cn("pb-3 flex flex-row justify-between items-start")}>
                <CardTitle className={cn("text-lg leading-tight", isBest ? "md:text-xl" : "text-base")}>
                    {rec.jurisdiction} {stateLabel && `(${stateLabel})`} - {rec.companyType}
                </CardTitle>
                {rec.isBestPick && <Badge variant="default" className="bg-primary text-primary-foreground">Our Top Pick</Badge>}
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-12 flex-grow">
                <p className="italic text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: `${rec.reasoning.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}` }} />
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


  return (
    <div className="space-y-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Select Your Incorporation Services</h2>
        <p className="text-sm text-muted-foreground mb-6">Here are some incorporation options tailored to your needs. Click a card to select it. The price shown is for the incorporation itself; package/processing time costs will be added below.</p>
        
        {(bestRec || altRecs.length > 0) && (
            <div className="py-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bestRec && renderRecommendationCard(bestRec, true)}
                    {altRecs.map(rec => renderRecommendationCard(rec, false))}
                </div>
            </div>
        )}

        <div className="py-2">
            <Accordion type="single" collapsible className="w-full" value={manualConfigAccordionValue} onValueChange={setManualConfigAccordionValue}>
                <AccordionItem value="manual-config" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-2">
                        <div className="flex items-center space-x-2 w-full">
                            <Settings className="h-5 w-5 text-primary"/>
                            <h3 className="text-xl font-semibold">Customize Your Incorporation</h3>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Fine-tune your selection or choose a different combination.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4 items-end">
                            {!isPrimaryRegionUSA && (
                                <div>
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
                                 <div className={cn(isPrimaryRegionUSA ? "md:col-span-1" : "md:col-span-2")}> {/* Takes full width if jurisdiction is hidden and USA focus*/}
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

                             <div className={cn("md:col-span-1")}>
                                <Label htmlFor="companyType">Company Type</Label>
                                <Select
                                    value={orderData.incorporation?.companyType || ''}
                                    onValueChange={(value) => handleManualIncorporationChange('companyType', value)}
                                    disabled={
                                        (!isPrimaryRegionUSA && !orderData.incorporation?.jurisdiction) ||
                                        ((isPrimaryRegionUSA || orderData.incorporation?.jurisdiction === 'United States of America') && !orderData.incorporation?.state)}
                                >
                                    <SelectTrigger id="companyType" className="w-full mt-1"><SelectValue placeholder="Select Company Type" /></SelectTrigger>
                                    <SelectContent>{currentCompanyTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             {orderData.incorporation?.jurisdiction && orderData.incorporation.companyType && (isPrimaryRegionUSA || orderData.incorporation.jurisdiction === 'United States of America' ? orderData.incorporation.state : true) && (
                                <div className="text-primary font-semibold text-lg md:col-span-2 md:text-right">
                                    From ${orderData.incorporation.price !== undefined ? orderData.incorporation.price : CUSTOM_INCORP_BASE_PRICE}
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
        
        <Accordion type="single" collapsible className="w-full" value={packageSectionAccordionValue} onValueChange={setPackageSectionAccordionValue}>
            <AccordionItem value="package-selection-item" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center space-x-2 w-full">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">{packageSectionTitle}</h3>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
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
                </AccordionContent>
            </AccordionItem>
        </Accordion>


        <div className="space-y-3 py-4">
            <div className="flex items-center space-x-2 mb-1">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Popular Add-ons</h3>
            </div>
            <p className="text-sm text-muted-foreground">Consider these popular services for your new company.</p>
            <Accordion type="multiple" className="w-full space-y-2" value={openAddonAccordionItems} onValueChange={setOpenAddonAccordionItems}>
                {(orderData.addOns || INITIAL_ADDONS).map(addon => (
                <AccordionItem key={addon.id} value={addon.id} className="border rounded-md overflow-hidden">
                    <AccordionTrigger className="p-4 hover:no-underline flex justify-between items-center w-full">
                        <span className="font-medium mr-auto">{addon.name}</span>
                        <div className="flex items-center">
                            <span className="text-primary font-semibold mr-3">From ${addon.price}</span>
                            {/* ChevronDown is automatically added by AccordionTrigger */}
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
                        {addon.selected && addon.id === 'banking_assistance' && ( // Example for specific addon settings
                            <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm">
                                <p className="font-medium mb-1">Banking Preferences:</p>
                                <Label htmlFor={`bank-currency-${addon.id}`}>Preferred Currency:</Label>
                                <Input id={`bank-currency-${addon.id}`} placeholder="e.g., USD, EUR" className="mt-1 mb-2 text-xs h-8" />
                                <Label htmlFor={`bank-region-${addon.id}`}>Preferred Banking Region:</Label>
                                <Input id={`bank-region-${addon.id}`} placeholder="e.g., Singapore, Switzerland" className="mt-1 text-xs h-8" />
                                <p className="text-xs text-muted-foreground mt-2">Note: Our team will contact you to discuss specific bank options.</p>
                            </div>
                        )}
                         {addon.selected && addon.id !== 'banking_assistance' && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-xs text-muted-foreground">Additional settings or information for {addon.name} could appear here.</p>
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
