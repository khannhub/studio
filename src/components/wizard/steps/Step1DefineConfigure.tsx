'use client';

import type { FC } from 'react';
import { useState, useEffect, useTransition } from 'react';
import type { StepComponentProps, OrderData, AddOn, IncorporationDetails, BankingAssistance, OrderItem, INITIAL_ADDONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { recommendIncorporation, RecommendIncorporationInput } from '@/ai/flows/recommend-incorporation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const incorporationPackages = [
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
];

const Step1DefineConfigure: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  goToNextStep,
  isLoading,
  setIsLoading,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [aiRecommendation, setAiRecommendation] = useState<IncorporationDetails & BankingAssistance | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const localAddons = orderData.addOns && orderData.addOns.length > 0 ? orderData.addOns : [...INITIAL_ADDONS];


  useEffect(() => {
    // Sync initial add-ons to orderData if not present
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
    setIsLoading(true);
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
        // Pre-fill incorporation details with AI recommendation
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
              price: 250, // Example price
              reasoning: recommendation.reasoning,
            }
          })
        });
      } catch (error) {
        console.error("Error getting AI recommendation:", error);
        toast({ title: "AI Recommendation Failed", description: "Could not fetch AI recommendations. Please select manually.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  const handleIncorporationPackageSelect = (packageName: string) => {
    const selectedPkg = incorporationPackages.find(pkg => pkg.name === packageName);
    if (selectedPkg) {
      const newIncorporationData = {
        ...orderData.incorporation,
        packageName: selectedPkg.name,
        price: selectedPkg.price,
      };
      updateOrderData({ incorporation: newIncorporationData });
      updateOrderItem('incorporation_service', {
        name: `${orderData.incorporation?.jurisdiction || 'Jurisdiction'} ${orderData.incorporation?.companyType || 'Company'} - ${selectedPkg.name} Package`,
        price: selectedPkg.price,
        quantity: 1,
        description: `Incorporation services: ${selectedPkg.features.join(', ')}`
      });
    }
  };

  const handleBankingAssistSelect = (selected: boolean) => {
    const newBankingData = {
      ...orderData.bankingAssistance,
      selected: selected,
      price: selected ? 250 : 0, // Example price
      option: selected ? (orderData.bankingAssistance?.option || 'Standard Banking Assistance') : undefined,
    };
    updateOrderData({ bankingAssistance: newBankingData });
    if (selected) {
      addOrderItem({ id: 'banking_assistance', name: 'Banking Assistance', price: newBankingData.price!, quantity: 1 });
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

  const nextQuestion = () => setCurrentQuestion(prev => prev + 1);
  const prevQuestion = () => setCurrentQuestion(prev => prev - 1);

  const questions = [
    // Question 0: Email
    <div key="q0">
      <Label htmlFor="email" className="text-lg font-medium">Let's get started. What's your email?</Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={orderData.userEmail || ''}
        onChange={(e) => updateOrderData({ userEmail: e.target.value })}
        className="mt-2"
      />
    </div>,
    // Question 1: Purpose of business
    <div key="q1">
      <Label htmlFor="purpose" className="text-lg font-medium">What is the main purpose of your business?</Label>
      <Input
        id="purpose"
        placeholder="e.g., E-commerce, Consulting, Holding Company"
        value={orderData.needsAssessment?.purpose || ''}
        onChange={(e) => handleNeedsAssessmentChange('purpose', e.target.value)}
        className="mt-2"
      />
    </div>,
    // Question 2: Priorities
    <div key="q2">
      <Label htmlFor="priorities" className="text-lg font-medium">What are your key priorities?</Label>
      <Input
        id="priorities"
        placeholder="e.g., Tax optimization, Privacy, Ease of management, Access to specific markets"
        value={orderData.needsAssessment?.priorities || ''}
        onChange={(e) => handleNeedsAssessmentChange('priorities', e.target.value)}
        className="mt-2"
      />
    </div>,
    // Question 3: Region of operation
    <div key="q3">
      <Label htmlFor="region" className="text-lg font-medium">What is your primary region of operation?</Label>
      <Input
        id="region"
        placeholder="e.g., Global, North America, Europe, Asia"
        value={orderData.needsAssessment?.region || ''}
        onChange={(e) => handleNeedsAssessmentChange('region', e.target.value)}
        className="mt-2"
      />
    </div>,
     // Question 4: Business Description
    <div key="q4">
      <Label htmlFor="businessDescription" className="text-lg font-medium">Briefly describe your business (optional).</Label>
       <Textarea
        id="businessDescription"
        placeholder="Provide a short summary of your business activities and goals."
        value={orderData.needsAssessment?.businessDescription || ''}
        onChange={(e) => handleNeedsAssessmentChange('businessDescription', e.target.value)}
        className="mt-2 min-h-[100px]"
      />
    </div>,
    // Question 5: Banking Intent
    <div key="q5" className="space-y-3">
      <Label className="text-lg font-medium">Do you require banking assistance?</Label>
      <RadioGroup
        value={orderData.needsAssessment?.bankingIntent === undefined ? "" : String(orderData.needsAssessment.bankingIntent)}
        onValueChange={(value) => handleNeedsAssessmentChange('bankingIntent', value === 'true')}
        className="flex space-x-4"
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
    </div>,
    // Question 6: AI Recommendation &amp; Core Service Selection
    <div key="q6" className="space-y-6">
      <Button onClick={handleGetRecommendation} disabled={isLoading || isPending || !orderData.needsAssessment?.purpose || !orderData.needsAssessment?.priorities || !orderData.needsAssessment?.region} className="w-full">
        {(isLoading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Wand2 className="mr-2 h-4 w-4" /> Get AI Recommendations &amp; Select Services
      </Button>

      {(isLoading || isPending) && <p className="text-center text-muted-foreground">Fetching recommendations...</p>}

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

      {/* Manual Incorporation Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Incorporation Service</CardTitle>
          <CardDescription>Choose your jurisdiction, company type, and package.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input id="jurisdiction" placeholder="e.g., Delaware, BVI, Singapore" value={orderData.incorporation?.jurisdiction || ''} onChange={e => updateOrderData(prev => ({ incorporation: {...prev.incorporation, jurisdiction: e.target.value }}))} />
            </div>
            <div>
              <Label htmlFor="companyType">Company Type</Label>
              <Input id="companyType" placeholder="e.g., LLC, Ltd, S Corp" value={orderData.incorporation?.companyType || ''} onChange={e => updateOrderData(prev => ({ incorporation: {...prev.incorporation, companyType: e.target.value }}))} />
            </div>
          </div>
          <div>
            <Label>Incorporation Package</Label>
            <RadioGroup
              value={orderData.incorporation?.packageName || ""}
              onValueChange={handleIncorporationPackageSelect}
              className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {incorporationPackages.map(pkg => (
                <Label key={pkg.name} htmlFor={pkg.name} className="flex flex-col items-start cursor-pointer rounded-lg border bg-card p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary/10">
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
        </CardContent>
      </Card>
      
      {/* Banking Assistance */}
      {orderData.needsAssessment?.bankingIntent && (
        <Card>
          <CardHeader>
            <CardTitle>Banking Assistance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-2">
            <Switch id="bankingAssistSwitch" checked={orderData.bankingAssistance?.selected || false} onCheckedChange={handleBankingAssistSelect} />
            <Label htmlFor="bankingAssistSwitch">Add Banking Assistance ($250)</Label>
          </CardContent>
           {orderData.bankingAssistance?.selected && orderData.bankingAssistance.reasoning && (
             <CardFooter>
                <p className="text-xs text-muted-foreground">AI Suggestion: {orderData.bankingAssistance.reasoning}</p>
             </CardFooter>
           )}
        </Card>
      )}

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Add-ons</CardTitle>
          <CardDescription>Consider these popular services for your new company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {localAddons.slice(0,3).map(addon => ( // Show first 3 as popular
            <div key={addon.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50">
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
        </CardContent>
      </Card>
    </div>,
  ];

  const isEmailValid = orderData.userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.userEmail);
  const canProceedFromEmail = currentQuestion === 0 && isEmailValid;
  const canProceedFromQuestions = currentQuestion > 0 && currentQuestion < questions.length -1;
  const canProceedToNextStep = currentQuestion === questions.length -1 && orderData.incorporation?.packageName;


  return (
    <div className="space-y-8">
      <div className="min-h-[200px] p-2 transition-all duration-300 ease-in-out">
         {questions[currentQuestion]}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0 || isLoading || isPending}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {currentQuestion < questions.length - 1 ? (
          <Button onClick={nextQuestion} disabled={isLoading || isPending || (currentQuestion === 0 && !canProceedFromEmail) }>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={goToNextStep} disabled={isLoading || isPending || !canProceedToNextStep}>
            Proceed to Details <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Step1DefineConfigure;
