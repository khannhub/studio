
'use client';

import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { StepComponentProps, OrderData, AddOn, IncorporationDetails, BankingAssistance, IncorporationRecommendationItem } from '@/lib/types';
import { INITIAL_ADDONS, JURISDICTIONS_LIST, US_STATES_LIST, US_COMPANY_TYPES_LIST, INTERNATIONAL_COMPANY_TYPES_LIST } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, ChevronRight, ChevronLeft, Package, Banknote, ShoppingBag, Building, Info, Lightbulb, Settings, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export const incorporationPackages = [
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
];

const Step2SelectServices: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  goToNextStep,
  goToPrevStep,
  isLoading,
}) => {
  const { toast } = useToast();
  const [isPrimaryRegionUSA, setIsPrimaryRegionUSA] = useState(false);
  const [currentCompanyTypes, setCurrentCompanyTypes] = useState<string[]>(INTERNATIONAL_COMPANY_TYPES_LIST);
  const [selectedIncorporationKey, setSelectedIncorporationKey] = useState<string | null>(null);
  const [manualConfigAccordionValue, setManualConfigAccordionValue] = useState<string | undefined>(undefined);


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


  useEffect(() => {
    const primaryRegionIsUSAEntry = orderData.needsAssessment?.region === 'United States of America';
    setIsPrimaryRegionUSA(primaryRegionIsUSAEntry);

    const currentJurisdiction = orderData.incorporation?.jurisdiction;
    const currentState = orderData.incorporation?.state;
    const currentCompanyType = orderData.incorporation?.companyType;

    // Determine current company types list based on selected jurisdiction
    if (currentJurisdiction === 'United States of America') {
        setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
    } else {
        setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
    }
    
    // Initialize selectedIncorporationKey based on current orderData or AI best pick
    if (currentJurisdiction && currentCompanyType) {
        const currentSelectionKey = `${currentJurisdiction}-${currentState || 'none'}-${currentCompanyType}`;
        setSelectedIncorporationKey(currentSelectionKey);

        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === currentSelectionKey
        );

        if (matchingAiRec && orderData.incorporation?.price !== matchingAiRec.price) {
             updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: matchingAiRec.price }
            }));
        } else if (!matchingAiRec && orderData.incorporation?.price === undefined) {
            updateOrderData(prev => ({
                incorporation: { ...prev.incorporation, price: 0 } // TBD for custom
            }));
        }
    } else if (orderData.incorporation?.aiBestRecommendation) {
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
        if (bestRec.jurisdiction === 'United States of America') {
            setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
        } else {
            setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
        }
    }
  }, [
    orderData.needsAssessment?.region,
    orderData.incorporation?.jurisdiction,
    orderData.incorporation?.companyType,
    orderData.incorporation?.state,
    orderData.incorporation?.aiBestRecommendation,
    updateOrderData,
    allAiRecommendations
  ]);


  useEffect(() => {
    if (!orderData.addOns || orderData.addOns.length === 0) {
      updateOrderData({ addOns: [...INITIAL_ADDONS] });
    }
  }, [orderData.addOns, updateOrderData]);


  const handleSelectAiRecommendation = (rec: IncorporationRecommendationItem) => {
    updateOrderData(prev => ({
        incorporation: {
            ...prev.incorporation, // Preserve existing package name and AI recommendations lists
            packageName: prev.incorporation?.packageName,
            aiBestRecommendation: prev.incorporation?.aiBestRecommendation,
            aiAlternativeRecommendations: prev.incorporation?.aiAlternativeRecommendations,

            // Set current user selections to the clicked AI pick
            jurisdiction: rec.jurisdiction,
            state: rec.state,
            companyType: rec.companyType,
            price: rec.price, // Base price from AI's pick
        }
    }));
    setSelectedIncorporationKey(`${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`);
    if (rec.jurisdiction === 'United States of America') {
        setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
    } else {
        setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
    }
    setManualConfigAccordionValue(undefined); // Collapse manual config section
  };

  const handleManualIncorporationChange = (field: keyof Pick<IncorporationDetails, 'jurisdiction' | 'state' | 'companyType'>, value: string) => {
    updateOrderData(prev => {
        let newIncorporation = { ...prev.incorporation } as IncorporationDetails;
        let companyTypeChanged = false;
        let jurisdictionChanged = false;

        if (field === 'jurisdiction') {
            newIncorporation.jurisdiction = value;
            jurisdictionChanged = true;
            if (value === 'United States of America') {
                setCurrentCompanyTypes(US_COMPANY_TYPES_LIST);
                if (!US_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = ''; companyTypeChanged = true;
                }
            } else {
                setCurrentCompanyTypes(INTERNATIONAL_COMPANY_TYPES_LIST);
                newIncorporation.state = ''; // Clear state if not USA
                if (!INTERNATIONAL_COMPANY_TYPES_LIST.includes(newIncorporation.companyType || '')) {
                    newIncorporation.companyType = ''; companyTypeChanged = true;
                }
            }
        } else if (field === 'state') {
            newIncorporation.state = value;
        } else if (field === 'companyType') {
            newIncorporation.companyType = value;
            companyTypeChanged = true;
        }

        const manualSelectionKey = `${newIncorporation.jurisdiction}-${newIncorporation.state || 'none'}-${newIncorporation.companyType}`;
        const matchingAiRec = allAiRecommendations.find(rec =>
            `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}` === manualSelectionKey
        );

        if (matchingAiRec) {
            newIncorporation.price = matchingAiRec.price;
            setSelectedIncorporationKey(manualSelectionKey);
        } else {
            const isUsaJurisdiction = newIncorporation.jurisdiction === 'United States of America';
            const allFieldsFilledForCustom = newIncorporation.jurisdiction && newIncorporation.companyType && (!isUsaJurisdiction || (isUsaJurisdiction && newIncorporation.state));

            if (allFieldsFilledForCustom) {
                 newIncorporation.price = 0; // Indicate Price on Request
                 if (companyTypeChanged || jurisdictionChanged || field === 'state') {
                    toast({ title: "Custom Configuration", description: "The price for this specific combination will be confirmed by our team.", duration: 5000 });
                 }
            } else {
                 newIncorporation.price = prev.incorporation?.price || 0; // Keep old price if not all fields filled
            }
            setSelectedIncorporationKey(null); // Not matching an AI rec
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

  const handleBankingAssistSelect = (selected: boolean) => {
    updateOrderData(prev => ({
        bankingAssistance: {
            ...prev.bankingAssistance,
            selected: selected,
            price: selected ? 250 : 0, 
            option: selected ? (prev.bankingAssistance?.option || "Standard Banking Assistance") : '',
            reasoning: selected ? prev.bankingAssistance?.reasoning : undefined,
        }
    }));
  };

  const handleAddonToggle = (addonId: string) => {
    const updatedAddons = (orderData.addOns || INITIAL_ADDONS).map(addon =>
      addon.id === addonId ? { ...addon, selected: !addon.selected } : addon
    );
    updateOrderData({ addOns: updatedAddons });
  };

  const isProceedButtonDisabled = isLoading ||
    !orderData.incorporation?.jurisdiction ||
    !orderData.incorporation?.companyType ||
    (orderData.incorporation.jurisdiction === 'United States of America' && !orderData.incorporation.state) ||
    orderData.incorporation.price === undefined ||
    !orderData.incorporation.packageName;


  const packageSectionLabel = isPrimaryRegionUSA ? "Select Incorporation Package" : "Select Processing Speed / Package Tier";

  const bestRec = orderData.incorporation?.aiBestRecommendation;
  const altRecs = orderData.incorporation?.aiAlternativeRecommendations || [];

  const renderRecommendationCard = (rec: IncorporationRecommendationItem, isBest: boolean) => {
    const key = `${rec.jurisdiction}-${rec.state || 'none'}-${rec.companyType}`;
    const isSelected = selectedIncorporationKey === key;
    const stateLabel = rec.state ? rec.state.split('-')[0] : '';

    return (
        <Card
            key={key}
            onClick={() => handleSelectAiRecommendation(rec)}
            className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl overflow-hidden relative",
                isSelected ? "ring-2 ring-primary shadow-lg border-primary" : "border-border hover:border-primary/70",
                isBest ? "md:col-span-3" : "md:col-span-1" 
            )}
        >
            <CardHeader className={cn("pb-2")}>
                <div className="flex justify-between items-start">
                    <CardTitle className={cn("text-lg", isBest ? "md:text-xl" : "text-base")}>
                        {rec.jurisdiction} {stateLabel && `(${stateLabel})`} - {rec.companyType}
                    </CardTitle>
                </div>
                {rec.isBestPick && <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground">Our Top Pick</Badge>}
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-12">
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: `<strong>Reasoning:</strong> ${rec.reasoning.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}` }} />
                <div className={cn(
                    "absolute bottom-3 right-3 font-bold text-primary", 
                    isBest ? "text-xl" : "text-lg" // Adjusted alternative price size slightly
                )}>
                    ${rec.price}
                </div>
            </CardContent>
        </Card>
    );
  };


  return (
    <div className="space-y-8">
        {(bestRec || altRecs.length > 0) && (
            <div className="space-y-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                    <Lightbulb className="h-6 w-6 text-primary"/>
                    <h2 className="text-xl font-semibold">Our Recommendations</h2>
                </div>
                <p className="text-sm text-muted-foreground">Based on your needs, we suggest these options. Click to select one, or customize below.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bestRec && renderRecommendationCard(bestRec, true)}
                    {altRecs.map(rec => renderRecommendationCard(rec, false))}
                </div>
            </div>
        )}

        <div className="py-2">
            <Accordion type="single" collapsible className="w-full" value={manualConfigAccordionValue} onValueChange={setManualConfigAccordionValue}>
                <AccordionItem value="manual-config">
                    <AccordionTrigger>
                        <div className="flex items-center space-x-2 py-2 w-full">
                            <Settings className="h-6 w-6 text-primary"/>
                            <h2 className="text-xl font-semibold">Customize Your Incorporation</h2>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Select your preferred jurisdiction, company type, and package.</p>
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
                                <div className={cn(isPrimaryRegionUSA ? "md:col-span-2" : "md:col-span-1")}>
                                    <Label htmlFor="state">State</Label>
                                    <Select
                                        value={orderData.incorporation?.state || ''}
                                        onValueChange={(value) => handleManualIncorporationChange('state', value)}
                                    >
                                        <SelectTrigger id="state" className="w-full mt-1"><SelectValue placeholder="Select State" /></SelectTrigger>
                                        <SelectContent>{US_STATES_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className={cn(isPrimaryRegionUSA && orderData.incorporation?.state ? "md:col-span-2" : "md:col-span-1")}>
                                <Label htmlFor="companyType">Company Type</Label>
                                <Select
                                    value={orderData.incorporation?.companyType || ''}
                                    onValueChange={(value) => handleManualIncorporationChange('companyType', value)}
                                    disabled={!orderData.incorporation?.jurisdiction || (orderData.incorporation?.jurisdiction === 'United States of America' && !orderData.incorporation?.state)}
                                >
                                    <SelectTrigger id="companyType" className="w-full mt-1"><SelectValue placeholder="Select Company Type" /></SelectTrigger>
                                    <SelectContent>{currentCompanyTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        {orderData.incorporation?.price === 0 && orderData.incorporation?.jurisdiction && orderData.incorporation?.companyType && (isPrimaryRegionUSA ? orderData.incorporation?.state : true) && (
                            <Alert variant="default" className="bg-amber-100 border-amber-300 text-amber-800">
                                <Info className="h-4 w-4 text-amber-700" />
                                <AlertTitle>Price Confirmation Needed</AlertTitle>
                                <AlertDescription>
                                    The base price for your custom selection ({orderData.incorporation?.jurisdiction}
                                    {orderData.incorporation?.state ? ` (${orderData.incorporation.state.split('-')[0]})` : ''}
                                    {' '}{orderData.incorporation?.companyType}) will be confirmed by our team.
                                    The package price will be added to this confirmed base price.
                                </AlertDescription>
                            </Alert>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>


        <div className="space-y-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
                <Package className="h-6 w-6 text-primary" />
                 <h2 className="text-xl font-semibold">{packageSectionLabel}</h2>
            </div>
             <RadioGroup
                value={orderData.incorporation?.packageName || ""}
                onValueChange={handleIncorporationPackageSelect}
                className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
            {incorporationPackages.map(pkg => (
                <Label
                key={pkg.name}
                htmlFor={pkg.name}
                className={cn(
                    "flex flex-col items-start cursor-pointer rounded-lg border p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl",
                    orderData.incorporation?.packageName === pkg.name ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md' : 'bg-card border-border hover:border-primary/70'
                )}
                >
                <div className="flex items-center w-full">
                    <RadioGroupItem value={pkg.name} id={pkg.name} className="mr-2"/>
                    <span className="font-semibold">{pkg.name} - ${pkg.price}</span>
                </div>
                <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground space-y-1">
                    {pkg.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                </Label>
            ))}
            </RadioGroup>
        </div>

        <div className="space-y-3 py-2">
             <div className="flex items-center space-x-2 mb-1">
                <Banknote className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Banking Assistance</h2>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Switch
                    id="bankingAssistSwitch"
                    checked={orderData.bankingAssistance?.selected || false}
                    onCheckedChange={(checked) => handleBankingAssistSelect(checked)}
                    className="mr-3"
                />
                <Label htmlFor="bankingAssistSwitch" className="flex-grow cursor-pointer">Add Banking Assistance <span className="text-muted-foreground">($250)</span></Label>
            </div>
            {orderData.bankingAssistance?.selected && orderData.bankingAssistance.reasoning && (
            <p className="text-xs text-muted-foreground mt-1 p-2 bg-accent/20 rounded-md">
                Note: {orderData.bankingAssistance.reasoning}
            </p>
            )}
        </div>

        <div className="space-y-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Popular Add-ons</h2>
            </div>
            <p className="text-sm text-muted-foreground">Consider these popular services for your new company.</p>
            <div className="space-y-3">
                {(orderData.addOns || INITIAL_ADDONS).map(addon => (
                <div key={addon.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center">
                    <Switch id={addon.id} checked={addon.selected} onCheckedChange={() => handleAddonToggle(addon.id)} className="mr-3"/>
                    <Label htmlFor={addon.id} className="cursor-pointer">
                        {addon.name} <span className="text-muted-foreground">(${addon.price})</span>
                    </Label>
                    </div>
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><Info className="h-4 w-4"/></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>More information about {addon.name}.</p></TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                </div>
                ))}
            </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button variant="outline" onClick={goToPrevStep} disabled={isLoading}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={goToNextStep} disabled={isProceedButtonDisabled}>
            Proceed to Provide Details <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
  );
};

export default Step2SelectServices;

