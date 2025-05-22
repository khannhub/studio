
'use client';

import type { FC } from 'react';
import { useState, useEffect, useTransition, useRef } from 'react';
import type { StepComponentProps, OrderData, AddOn, IncorporationDetails, BankingAssistance, OrderItem } from '@/lib/types';
import { INITIAL_ADDONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, ChevronRight, ChevronLeft, Info, Building, ShieldCheck, Globe, Target, Briefcase, TrendingUp, User, PhoneIcon, MailQuestion, HelpCircle, FileText } from 'lucide-react';
import { recommendIncorporation, RecommendIncorporationInput } from '@/ai/flows/recommend-incorporation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import TypingText from '@/components/common/TypingText';
import { cn } from '@/lib/utils';

const incorporationPackages = [
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
];

const purposeOptions = [
  { id: 'ecommerce', value: 'E-commerce / Online Sales', label: 'E-commerce / Online Sales', icon: <Briefcase className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'consulting', value: 'Consulting / Professional Services', label: 'Consulting / Services', icon: <Briefcase className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'holding', value: 'Holding Company / Asset Protection', label: 'Holding / Asset Protection', icon: <ShieldCheck className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'software', value: 'Software / Technology Development', label: 'Tech / Software', icon: <Wand2 className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'trading', value: 'Trading / Investment', label: 'Trading / Investment', icon: <TrendingUp className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_purpose', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const prioritiesOptions = [
  { id: 'tax', value: 'Tax Optimization', label: 'Tax Optimization', icon: <Target className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'privacy', value: 'Privacy & Anonymity', label: 'Privacy & Anonymity', icon: <ShieldCheck className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'ease', value: 'Ease of Management & Low Compliance', label: 'Ease of Management', icon: <Briefcase className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'market_access', value: 'Access to Specific Markets/Banking', label: 'Market/Bank Access', icon: <Building className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'credibility', value: 'Credibility & Reputation', label: 'Credibility', icon: <Wand2 className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_priority', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const regionOptions = [
  { id: 'global', value: 'Global / No Specific Region', label: 'Global / No Specific', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'north_america', value: 'North America (USA, Canada)', label: 'North America', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'europe', value: 'Europe (EU/EEA, UK)', label: 'Europe', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'asia', value: 'Asia (Singapore, Hong Kong, etc.)', label: 'Asia', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'mena', value: 'Middle East & Africa', label: 'Middle East & Africa', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'latam', value: 'Latin America & Caribbean', label: 'Latin America', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_region', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const Step1DefineConfigure: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  goToNextStep,
  goToPrevStep, // Keep for completeness, though Step 1 is first
  isLoading: isGlobalLoading,
  setIsLoading: setGlobalIsLoading,
}) => {
  const [aiRecommendation, setAiRecommendation] = useState<IncorporationDetails & BankingAssistance | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const localAddons = orderData.addOns && orderData.addOns.length > 0 ? orderData.addOns : [...INITIAL_ADDONS];

  useEffect(() => {
    if (!orderData.addOns || orderData.addOns.length === 0) {
      updateOrderData({ addOns: [...INITIAL_ADDONS] });
    }
  }, [orderData.addOns, updateOrderData]);

  const handleNeedsAssessmentChange = (field: keyof NonNullable<OrderData['needsAssessment']>, value: string | boolean) => {
    updateOrderData(prev => ({
      needsAssessment: {
        ...prev.needsAssessment,
        [field]: value,
      },
    }));
  };

  const handleGetRecommendation = () => {
    if (!orderData.needsAssessment?.purpose || !orderData.needsAssessment?.priorities || !orderData.needsAssessment?.region) {
      toast({ title: "Missing Information", description: "Please fill in Purpose, Priorities, and Region to get recommendations.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setGlobalIsLoading(true);
    startTransition(async () => {
      try {
        const input: RecommendIncorporationInput = {
          businessPurpose: orderData.needsAssessment!.purpose!,
          priorities: orderData.needsAssessment!.priorities!,
          region: orderData.needsAssessment!.region!,
        };
        const recommendation = await recommendIncorporation(input);
        setAiRecommendation({
          jurisdiction: recommendation.jurisdiction,
          companyType: recommendation.companyType,
          reasoning: recommendation.reasoning,
          ...(orderData.needsAssessment?.bankingIntent && { selected: true, option: `Recommended based on AI: ${recommendation.jurisdiction}` })
        });
        updateOrderData({
          incorporation: {
            ...orderData.incorporation,
            jurisdiction: recommendation.jurisdiction,
            companyType: recommendation.companyType,
            reasoning: recommendation.reasoning,
          },
          ...(orderData.needsAssessment?.bankingIntent && {
            bankingAssistance: {
              selected: true,
              option: `AI Recommended: ${recommendation.jurisdiction} (${recommendation.companyType})`,
              price: 250,
              reasoning: recommendation.reasoning,
            }
          })
        });
         // Automatically update the incorporation service item if a package is already selected
        if (orderData.incorporation?.packageName) {
          const selectedPkg = incorporationPackages.find(pkg => pkg.name === orderData.incorporation!.packageName);
          if (selectedPkg) {
             updateOrderItem('incorporation_service', {
                name: `${recommendation.jurisdiction} ${recommendation.companyType} - ${selectedPkg.name} Package`,
                price: selectedPkg.price,
                description: `Incorporation services: ${selectedPkg.features.join(', ')}. Reasoning: ${recommendation.reasoning?.substring(0,100) || 'N/A'}...`
              });
          }
        }

      } catch (error) {
        console.error("Error getting AI recommendation:", error);
        toast({ title: "AI Recommendation Failed", description: "Could not fetch AI recommendations. Please select manually.", variant: "destructive" });
      } finally {
        setIsAiLoading(false);
        setGlobalIsLoading(false);
      }
    });
  };

  const handleIncorporationPackageSelect = (packageName: string) => {
    const selectedPkg = incorporationPackages.find(pkg => pkg.name === packageName);
    if (selectedPkg) {
      const newIncorporationData = {
        jurisdiction: orderData.incorporation?.jurisdiction || aiRecommendation?.jurisdiction || '',
        companyType: orderData.incorporation?.companyType || aiRecommendation?.companyType || '',
        reasoning: orderData.incorporation?.reasoning || aiRecommendation?.reasoning || '',
        packageName: selectedPkg.name,
        price: selectedPkg.price,
      };
      updateOrderData({ incorporation: newIncorporationData });
      const itemName = `${newIncorporationData.jurisdiction || 'Selected Jurisdiction'} ${newIncorporationData.companyType || 'Company Type'} - ${selectedPkg.name} Package`;
      const itemDescription = `Includes ${selectedPkg.name} features. Jurisdiction: ${newIncorporationData.jurisdiction}, Type: ${newIncorporationData.companyType}. ${newIncorporationData.reasoning ? 'AI Reasoning: '+newIncorporationData.reasoning.substring(0,100)+'...' : ''}`.trim();

      // Check if item exists to decide between add or update
      const existingItem = orderData.orderItems?.find(item => item.id === 'incorporation_service');
      if(existingItem){
         updateOrderItem('incorporation_service', {
          name: itemName,
          price: selectedPkg.price,
          quantity: 1,
          description: itemDescription
        });
      } else {
         addOrderItem({
          id: 'incorporation_service',
          name: itemName,
          price: selectedPkg.price,
          quantity: 1,
          description: itemDescription
        });
      }
    }
  };

  const handleBankingAssistSelect = (selected: boolean) => {
    const newBankingData = {
      ...orderData.bankingAssistance,
      selected: selected,
      price: selected ? 250 : 0,
      option: selected ? (orderData.bankingAssistance?.option || 'Standard Banking Assistance') : undefined,
    };
    updateOrderData({ bankingAssistance: newBankingData });
    if (selected) {
      addOrderItem({ id: 'banking_assistance', name: 'Banking Assistance', price: newBankingData.price!, quantity: 1, description: newBankingData.option });
    } else {
      removeOrderItem('banking_assistance');
    }
  };

  const handleAddonToggle = (addonId: string) => {
    const updatedAddons = localAddons.map(addon =>
      addon.id === addonId ? { ...addon, selected: !addon.selected } : addon
    );
    updateOrderData({ addOns: updatedAddons });
    const toggledAddon = updatedAddons.find(a => a.id === addonId);
    if (toggledAddon) {
      if (toggledAddon.selected) {
        addOrderItem({ id: toggledAddon.id, name: toggledAddon.name, price: toggledAddon.price, quantity: 1 });
      } else {
        removeOrderItem(toggledAddon.id);
      }
    }
  };

  const renderSelectionCards = (
    options: { id: string; value: string; label: string; icon?: JSX.Element }[],
    selectedValue: string | undefined,
    onChange: (value: string) => void,
    groupName: string
  ) => (
    <RadioGroup
      value={selectedValue}
      onValueChange={onChange}
      className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-2"
    >
      {options.map(option => (
        <Label
          key={option.id}
          htmlFor={`${groupName}-${option.id}`}
          className={cn(
            "flex flex-col items-center justify-center text-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out",
            "hover:-translate-y-1 hover:shadow-xl",
            selectedValue === option.value ? 'border-primary ring-2 ring-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:shadow-sm hover:border-primary/70'
          )}
        >
          <RadioGroupItem value={option.value} id={`${groupName}-${option.id}`} className="sr-only" />
          {option.icon}
          <span className="text-xs sm:text-sm font-medium leading-tight">{option.label}</span>
        </Label>
      ))}
    </RadioGroup>
  );

  const isEmailValid = orderData.userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.userEmail);
  const isPhoneValid = orderData.userPhone && orderData.userPhone.trim() !== '';

  const isProceedToDetailsButtonDisabled =
    isGlobalLoading ||
    isAiLoading ||
    isPending ||
    !isEmailValid ||
    !isPhoneValid ||
    !orderData.needsAssessment?.purpose ||
    !orderData.needsAssessment?.priorities ||
    !orderData.needsAssessment?.region ||
    orderData.needsAssessment?.bankingIntent === undefined ||
    !orderData.incorporation?.packageName;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <TypingText text="Your Contact Information" speed={25} as="span" className="flex items-center" />
          </CardTitle>
          <CardDescription>Please provide your primary contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center"><User className="mr-2 h-4 w-4 text-primary"/> Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={orderData.userEmail || ''}
              onChange={(e) => updateOrderData({ userEmail: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center"><PhoneIcon className="mr-2 h-4 w-4 text-primary"/> Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={orderData.userPhone || ''}
              onChange={(e) => updateOrderData({ userPhone: e.target.value })}
              className="mt-1"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
             <TypingText text="Understanding Your Needs" speed={25} as="span" className="flex items-center" />
          </CardTitle>
          <CardDescription>Tell us about your business to help us recommend the best options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="flex items-center"><MailQuestion className="mr-2 h-4 w-4 text-primary"/> What is the main purpose of your business?</Label>
            {renderSelectionCards(purposeOptions, orderData.needsAssessment?.purpose, (value) => handleNeedsAssessmentChange('purpose', value), 'purpose')}
          </div>
          <div>
            <Label className="flex items-center"><Target className="mr-2 h-4 w-4 text-primary"/> What are your key priorities?</Label>
            {renderSelectionCards(prioritiesOptions, orderData.needsAssessment?.priorities, (value) => handleNeedsAssessmentChange('priorities', value), 'priorities')}
          </div>
          <div>
            <Label className="flex items-center"><Globe className="mr-2 h-4 w-4 text-primary"/> What is your primary region of operation?</Label>
            {renderSelectionCards(regionOptions, orderData.needsAssessment?.region, (value) => handleNeedsAssessmentChange('region', value), 'region')}
          </div>
          <div>
            <Label htmlFor="businessDescription" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary"/> Briefly describe your business (optional).</Label>
            <Textarea
              id="businessDescription"
              placeholder="Provide a short summary of your business activities and goals."
              value={orderData.needsAssessment?.businessDescription || ''}
              onChange={(e) => handleNeedsAssessmentChange('businessDescription', e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
           <div>
            <Label className="flex items-center"><Building className="mr-2 h-4 w-4 text-primary"/> Do you require banking assistance?</Label>
            <RadioGroup
              value={orderData.needsAssessment?.bankingIntent === undefined ? "" : String(orderData.needsAssessment.bankingIntent)}
              onValueChange={(value) => handleNeedsAssessmentChange('bankingIntent', value === 'true')}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="bankingYes" />
                <Label htmlFor="bankingYes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="bankingNo" />
                <Label htmlFor="bankingNo">No</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleGetRecommendation} disabled={isAiLoading || isPending || !orderData.needsAssessment?.purpose || !orderData.needsAssessment?.priorities || !orderData.needsAssessment?.region} className="w-full md:w-auto">
          {(isAiLoading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Wand2 className="mr-2 h-4 w-4" /> Get AI Recommendations
        </Button>
      </div>

      {aiRecommendation && (
        <Alert variant="default" className="bg-accent/50 border-accent">
          <Wand2 className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">AI Recommendation</AlertTitle>
          <AlertDescription>
            <p><strong>Jurisdiction:</strong> {aiRecommendation.jurisdiction}</p>
            <p><strong>Company Type:</strong> {aiRecommendation.companyType}</p>
            <p><strong>Reasoning:</strong> {aiRecommendation.reasoning}</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <TypingText text="Select Your Services" speed={25} as="span" className="flex items-center" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-card">
            <h4 className="font-semibold mb-1 text-lg">Incorporation Service</h4>
            <p className="text-sm text-muted-foreground mb-3">Choose your jurisdiction, company type, and package.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input id="jurisdiction" placeholder="e.g., Delaware, BVI" value={orderData.incorporation?.jurisdiction || aiRecommendation?.jurisdiction || ''} onChange={e => updateOrderData(prev => ({ incorporation: {...prev.incorporation, jurisdiction: e.target.value }}))} />
              </div>
              <div>
                <Label htmlFor="companyType">Company Type</Label>
                <Input id="companyType" placeholder="e.g., LLC, Ltd" value={orderData.incorporation?.companyType || aiRecommendation?.companyType || ''} onChange={e => updateOrderData(prev => ({ incorporation: {...prev.incorporation, companyType: e.target.value }}))} />
              </div>
            </div>
            <div>
              <Label>Incorporation Package</Label>
              <RadioGroup
                value={orderData.incorporation?.packageName || ""}
                onValueChange={handleIncorporationPackageSelect}
                className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {incorporationPackages.map(pkg => (
                  <Label key={pkg.name} htmlFor={pkg.name} className={cn("flex flex-col items-start cursor-pointer rounded-lg border p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl", orderData.incorporation?.packageName === pkg.name ? 'border-primary ring-2 ring-primary bg-primary/10 shadow-md' : 'bg-card border-border hover:border-primary/70')}>
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
          </div>

          {orderData.needsAssessment?.bankingIntent && (
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-semibold mb-1 text-lg">Banking Assistance</h4>
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="bankingAssistSwitch" checked={orderData.bankingAssistance?.selected || false} onCheckedChange={handleBankingAssistSelect} />
                <Label htmlFor="bankingAssistSwitch">Add Banking Assistance ($250)</Label>
              </div>
              {orderData.bankingAssistance?.selected && orderData.bankingAssistance.reasoning && (
                <p className="text-xs text-muted-foreground mt-2">AI Suggestion: {orderData.bankingAssistance.reasoning}</p>
              )}
            </div>
          )}

          <div className="p-4 border rounded-lg bg-card">
            <h4 className="font-semibold mb-1 text-lg">Popular Add-ons</h4>
            <p className="text-sm text-muted-foreground mb-3">Consider these popular services for your new company.</p>
            <div className="space-y-3">
              {localAddons.slice(0,3).map(addon => (
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
                      <TooltipContent>
                        <p>More information about {addon.name}.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
              <Button variant="link" className="p-0 h-auto text-primary">Explore all other services</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center mt-8 pt-6 border-t">
        {/* Previous button is not strictly needed in a single page Step 1, but kept for consistency if this component were part of a larger flow */}
        {/* <Button variant="outline" onClick={goToPrevStep} disabled={isGlobalLoading || isAiLoading || isPending}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button> */}
        <Button onClick={goToNextStep} disabled={isProceedToDetailsButtonDisabled}>
          Proceed to Details <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Step1DefineConfigure;

    