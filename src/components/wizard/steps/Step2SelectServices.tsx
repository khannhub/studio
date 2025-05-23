
'use client';

import type { FC } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { StepComponentProps, IncorporationRecommendationItem, IncorporationDetails, AddOn } from '@/lib/types';
import { JURISDICTIONS_LIST, US_STATES_LIST, US_COMPANY_TYPES_LIST, INTERNATIONAL_COMPANY_TYPES_LIST, INITIAL_ADDONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
// RadioGroup and RadioGroupItem removed as package selection will be card-click based
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Package, ShoppingBag, Building, Info, Settings, Loader2, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { prefillCompanyDetails, type PrefillCompanyDetailsInput, type PrefillCompanyDetailsOutput } from '@/ai/flows/prefill-company-details';

// Reordered by descending price
export const incorporationPackages = [ // For USA (Exclusive Focus)
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
];

// Reordered by descending price
export const processingTimePackages = [ // For other regions
  { name: 'Super Urgent', price: 1299, features: ['Fastest Processing (1-2 days)', 'Dedicated Support Line', 'Digital & Physical Docs Priority'] },
  { name: 'Express', price: 899, features: ['Expedited Processing (3-5 days)', 'Priority Support', 'Digital Docs First'] },
  { name: 'Normal', price: 499, features: ['Standard Processing (5-10 days)', 'Standard Support', 'Standard Document Delivery'] },
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
        recommendations.push(...orderData.incorporation.aiAlternativeRecommendations.map(alt => ({ ...alt, isBestPick: false })));
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
            updateOrderData(prev => ({ incorporation: { ...prev.incorporation, companyType: '' }}));
        }
    } else if (currentJurisdiction && currentJurisdiction !== 'United States of America') {
        if (!INTERNATIONAL_COMPANY_TYPES_LIST.includes(currentCompanyType || '')) {
             updateOrderData(prev => ({ incorporation: { ...prev.incorporation, companyType: '' }}));
        }
    }
    setCurrentCompanyTypes(activeCompanyTypes);

    const hasValidIncorporationSelection = currentJurisdiction && currentCompanyType && ( (primaryRegionIsUSAEntry || currentJurisdiction === 'United States of America') ? currentState : true );

    if (hasValidIncorporationSelection) {
        const key = `${currentJurisdiction}-${currentState || 'none'}-${currentCompanyType}`;
        setSelectedIncorporationKey(key);
        setPackageSectionAccordionValue("package-selection-item"); // Expand package section

        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === key
        );

        if (matchingAiRec && orderData.incorporation?.price !== matchingAiRec.price) {
             updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: matchingAiRec.price }
            }));
        } else if (!matchingAiRec && orderData.incorporation?.price === undefined) {
            updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: 0 }
            }));
        }
         // Default package selection
        if (!orderData.incorporation?.packageName && displayedPackages.length > 0) {
            const middlePackageIndex = Math.floor(displayedPackages.length / 2);
            updateOrderData(prev => ({
            incorporation: {
                ...prev.incorporation,
                packageName: displayedPackages[middlePackageIndex].name,
            }
            }));
        }

    } else if (orderData.incorporation?.aiBestRecommendation && !orderData.incorporation.jurisdiction) { // Only if not manually set
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
        setPackageSectionAccordionValue("package-selection-item"); // Expand package section
         // Default package selection for AI best pick
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
            ...prev.incorporation, // Keep existing AI recs and reasoning
            jurisdiction: rec.jurisdiction,
            state: rec.state,
            companyType: rec.companyType,
            price: rec.price,
            // Reset package if jurisdiction context changes affecting package types
            packageName: (isPrimaryRegionUSA !== (rec.jurisdiction === 'United States of America')) ? undefined : prev.incorporation?.packageName,
        }
    }));
    setSelectedIncorporationKey(`${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`);
    setManualConfigAccordionValue(undefined); 
    setPackageSectionAccordionValue("package-selection-item"); // Expand package section

     // Default package selection after AI rec selected
    if (displayedPackages.length > 0) {
        const middlePackageIndex = Math.floor(displayedPackages.length / 2);
        updateOrderData(prev => ({
        incorporation: {
            ...prev.incorporation,
            packageName: displayedPackages[middlePackageIndex].name,
        }
        }));
    }
  };

  const handleManualIncorporationChange = (field: keyof Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType'>, value: string) => {
    updateOrderData(prev => {
        let newIncorporation = { ...prev.incorporation } as IncorporationDetails;
        let companyTypeChangedOrCleared = false;
        let jurisdictionOrStateChanged = false;

        if (field === 'jurisdiction') {
            newIncorporation.jurisdiction = value;
            jurisdictionOrStateChanged = true;
            const newPrimaryRegionIsUSA = value === 'United States of America';
            setIsPrimaryRegionUSA(newPrimaryRegionIsUSA); // Update local state for dynamic UI

            if (newPrimaryRegionIsUSA) {
                setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
                if (!US_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = ''; companyTypeChangedOrCleared = true;
                }
            } else {
                setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
                newIncorporation.state = ''; // Clear state if not USA
                if (!INTERNATIONAL_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = ''; companyTypeChangedOrCleared = true;
                }
            }
            // Reset package if jurisdiction context changes affecting package types
            if (isPrimaryRegionUSA !== newPrimaryRegionIsUSA) {
                newIncorporation.packageName = undefined;
            }
        } else if (field === 'state') {
            newIncorporation.state = value;
            jurisdictionOrStateChanged = true;
            setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
            if (!US_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                newIncorporation.companyType = ''; companyTypeChangedOrCleared = true;
            }
        } else if (field === 'companyType') {
            newIncorporation.companyType = value;
            companyTypeChangedOrCleared = true;
        }

        const manualSelectionKey = `${newIncorporation.jurisdiction}-${newIncorporation.state || 'none'}-${newIncorporation.companyType}`;
        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === manualSelectionKey
        );

        if (matchingAiRec) {
            newIncorporation.price = matchingAiRec.price;
            setSelectedIncorporationKey(manualSelectionKey);
        } else {
            const isCurrentSelectionUSAContext = isPrimaryRegionUSA || newIncorporation.jurisdiction === 'United States of America';
            const allFieldsFilledForCustom = newIncorporation.jurisdiction && newIncorporation.companyType && (!isCurrentSelectionUSAContext || (isCurrentSelectionUSAContext && newIncorporation.state));

            if (allFieldsFilledForCustom) {
                 newIncorporation.price = 0;
                 if (companyTypeChangedOrCleared || jurisdictionOrStateChanged) {
                    toast({ title: "Custom Configuration", description: "The price for this specific combination will be confirmed by our team.", duration: 5000 });
                 }
            } else {
                 newIncorporation.price = prev.incorporation?.price; // Or undefined if not previously set
            }
            setSelectedIncorporationKey(null); // Deselect AI cards if manual config doesn't match
        }
        
        // Expand package section if all manual fields are filled
        const currentIsUsaContext = prev.needsAssessment?.region === 'USA (Exclusive Focus)' || newIncorporation.jurisdiction === 'United States of America';
        if (newIncorporation.jurisdiction && newIncorporation.companyType && (!currentIsUsaContext || (currentIsUsaContext && newIncorporation.state))) {
            setPackageSectionAccordionValue("package-selection-item");
            // Default package if not set
            if (!newIncorporation.packageName && displayedPackages.length > 0) {
                const middlePackageIndex = Math.floor(displayedPackages.length / 2);
                newIncorporation.packageName = displayedPackages[middlePackageIndex].name;
            }
        } else {
            setPackageSectionAccordionValue(undefined); // Collapse if not all fields filled
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
          directors: prev.directors && prev.directors.length > 0
            ? prev.directors.map((dir, idx) => idx === 0 ? { ...dir, fullName: suggestions.suggestedDirector.fullName, email: suggestions.suggestedDirector.email } : dir)
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
    const stateLabel = rec.state ? rec.state.split('-')[0] : '';

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
            <CardHeader className={cn("pb-2 flex flex-row justify-between items-start")}>
                <CardTitle className={cn("text-lg leading-tight", isBest ? "md:text-xl" : "text-base")}>
                    {rec.jurisdiction} {stateLabel && `(${stateLabel})`} - {rec.companyType}
                </CardTitle>
                {rec.isBestPick && <Badge variant="default" className="bg-primary text-primary-foreground">Our Top Pick</Badge>}
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-12 flex-grow">
                 {rec.reasoning && <p className="italic text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: `${rec.reasoning.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}` }} />}
                <div className={cn(
                    "absolute bottom-3 right-3 font-bold text-primary",
                    isBest ? "text-xl" : "text-lg"
                )}>
                    ${rec.price}
                </div>
            </CardContent>
        </Card>
    );
  };


  return (
    <div className="space-y-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Select Your Incorporation Services</h2>
        
        <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">Here are some incorporation options tailored to your needs. Click a card to select it. The price shown is for the incorporation itself; package/processing time costs will be added below.</p>
        </div>

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
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center space-x-2 py-2 w-full">
                            <Settings className="h-5 w-5 text-primary"/>
                            <h3 className="text-xl font-semibold">Customize Your Incorporation</h3>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Fine-tune your selection or choose a different combination.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
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
                                <div className={cn(isPrimaryRegionUSA ? "md:col-span-1" : "md:col-span-1")}>
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
                        </div>
                        {orderData.incorporation?.price === 0 && orderData.incorporation?.jurisdiction && orderData.incorporation?.companyType && ( (isPrimaryRegionUSA || orderData.incorporation.jurisdiction === 'United States of America') ? orderData.incorporation?.state : true) && (
                            <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4" role="alert">
                                <p className="font-bold">Price Confirmation Needed</p>
                                <p>
                                    The base price for your custom selection ({orderData.incorporation?.jurisdiction}
                                    {orderData.incorporation?.state ? ` (${orderData.incorporation.state.split('-')[0]})` : ''}
                                    {' '}{orderData.incorporation?.companyType}) will be confirmed by our team.
                                    The package/processing time price will be added to this confirmed base price.
                                </p>
                            </div>
                        )}
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
                                {/* RadioGroupItem removed */}
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


        <div className="space-y-3 py-2">
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
                            <span className="text-primary font-semibold mr-2">${addon.price}</span>
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
                        {addon.selected && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-xs text-muted-foreground">Additional settings for {addon.name} could appear here if needed.</p>
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

