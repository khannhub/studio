
'use client';

import type { FC } from 'react';
import { useState, useTransition, useEffect } from 'react';
import type { StepComponentProps, OrderData, IncorporationDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { Loader2, Wand2, ChevronRight, Info, Building, ShieldCheck, Globe, Target, Briefcase, TrendingUp, User, PhoneIcon, MailQuestion, HelpCircle, FileText, ShoppingCart, Users, Cpu, EyeOff, SlidersHorizontal, Award, Landmark, Euro, Sunrise, Pyramid, Sprout } from 'lucide-react';
import { recommendIncorporation, type RecommendIncorporationInput } from '@/ai/flows/recommend-incorporation';
import { useToast } from '@/hooks/use-toast';
import TypingText from '@/components/common/TypingText';
import { cn } from '@/lib/utils';

const purposeOptions = [
  { id: 'ecommerce', value: 'E-commerce / Online Sales', label: 'E-commerce / Online Sales', icon: <ShoppingCart className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'consulting', value: 'Consulting / Professional Services', label: 'Consulting / Services', icon: <Users className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'holding', value: 'Holding Company / Asset Protection', label: 'Holding / Asset Protection', icon: <ShieldCheck className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'software', value: 'Software / Technology Development', label: 'Tech / Software', icon: <Cpu className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'trading', value: 'Trading / Investment', label: 'Trading / Investment', icon: <TrendingUp className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_purpose', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const prioritiesOptions = [
  { id: 'tax', value: 'Tax Optimization', label: 'Tax Optimization', icon: <Target className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'privacy', value: 'Privacy & Anonymity', label: 'Privacy & Anonymity', icon: <EyeOff className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'ease', value: 'Ease of Management & Low Compliance', label: 'Ease of Management', icon: <SlidersHorizontal className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'market_access', value: 'Access to Specific Markets/Banking', label: 'Market/Bank Access', icon: <Building className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'credibility', value: 'Credibility & Reputation', label: 'Credibility', icon: <Award className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_priority', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const regionOptions = [
  { id: 'global', value: 'Global / No Specific Region', label: 'Global / No Specific', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'north_america', value: 'North America (USA, Canada)', label: 'North America', icon: <Landmark className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'europe', value: 'Europe (EU/EEA, UK)', label: 'Europe', icon: <Euro className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'asia', value: 'Asia (Singapore, Hong Kong, etc.)', label: 'Asia', icon: <Sunrise className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'mena', value: 'Middle East & Africa', label: 'Middle East & Africa', icon: <Pyramid className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'latam', value: 'Latin America & Caribbean', label: 'Latin America', icon: <Sprout className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_region', value: 'Other', label: 'Other', icon: <HelpCircle className="h-5 w-5 mb-2 text-primary" /> },
];

const Step1DefineConfigure: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  goToNextStep,
  isLoading: isGlobalLoading,
  setIsLoading: setGlobalIsLoading,
}) => {
  const [aiRecommendation, setAiRecommendation] = useState<Pick<IncorporationDetails, 'jurisdiction' | 'companyType' | 'reasoning'> | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendationStage, setRecommendationStage] = useState<'initial' | 'fetched' | 'error'>('initial');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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
      toast({ title: "Missing Information", description: "Please select purpose, priorities, and region to get recommendations.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setGlobalIsLoading(true);
    setAiRecommendation(null); // Clear previous recommendation
    startTransition(async () => {
      try {
        const input: RecommendIncorporationInput = {
          businessPurpose: orderData.needsAssessment!.purpose!,
          priorities: orderData.needsAssessment!.priorities!,
          region: orderData.needsAssessment!.region!,
        };
        const recommendation = await recommendIncorporation(input);
        
        const recommendationResult = {
          jurisdiction: recommendation.jurisdiction,
          companyType: recommendation.companyType,
          reasoning: recommendation.reasoning,
        };
        setAiRecommendation(recommendationResult);

        updateOrderData(prev => ({
          ...prev,
          incorporation: {
            ...prev.incorporation,
            jurisdiction: recommendation.jurisdiction,
            companyType: recommendation.companyType,
            reasoning: recommendation.reasoning,
          },
          ...(prev.needsAssessment?.bankingIntent && {
            bankingAssistance: {
                ...prev.bankingAssistance,
                reasoning: `AI suggests considering banking options suitable for ${recommendation.jurisdiction} (${recommendation.companyType}).`,
            }
          })
        }));
        setRecommendationStage('fetched');
        toast({ title: "AI Recommendations Loaded", description: "Suggestions for jurisdiction and company type are now available.", variant: "default" });

      } catch (error) {
        console.error("Error getting AI recommendation:", error);
        toast({ title: "AI Recommendation Failed", description: "Could not fetch AI recommendations. Please try again or proceed manually.", variant: "destructive" });
        setRecommendationStage('error');
      } finally {
        setIsAiLoading(false);
        setGlobalIsLoading(false);
      }
    });
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

  let actionButtonText = '';
  let actionButtonOnClick: () => void = () => {};
  let isActionButtonDisabled = false;
  let showWandIcon = false;
  let showChevronIcon = false;

  if (recommendationStage === 'initial') {
    actionButtonText = 'Get Recommendations';
    actionButtonOnClick = handleGetRecommendation;
    isActionButtonDisabled =
      isGlobalLoading ||
      isAiLoading ||
      isPending ||
      !isEmailValid ||
      !isPhoneValid ||
      !orderData.needsAssessment?.purpose ||
      !orderData.needsAssessment?.priorities ||
      !orderData.needsAssessment?.region;
    showWandIcon = true;
  } else { // 'fetched' or 'error' stage
    actionButtonText = 'Proceed to Select Services';
    actionButtonOnClick = goToNextStep;
    isActionButtonDisabled =
      isGlobalLoading || 
      isPending || 
      !isEmailValid ||
      !isPhoneValid ||
      !orderData.needsAssessment?.purpose ||
      !orderData.needsAssessment?.priorities ||
      !orderData.needsAssessment?.region ||
      orderData.needsAssessment?.bankingIntent === undefined;
    showChevronIcon = true;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6 py-2">
        <div>
          <h2 className="text-xl font-semibold mb-1 flex items-center">
             Your Contact Information
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Please provide your primary contact details.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
        </div>
      </div>

      <div className="space-y-6 py-2">
        <div>
          <h2 className="text-xl font-semibold mb-1 flex items-center">
             Understanding Your Needs
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Tell us about your business to help us recommend the best options.</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <Label className="flex items-center text-base font-medium"><MailQuestion className="mr-2 h-4 w-4 text-primary"/> What is the main purpose of your business?</Label>
            {renderSelectionCards(purposeOptions, orderData.needsAssessment?.purpose, (value) => handleNeedsAssessmentChange('purpose', value), 'purpose')}
          </div>
          <div>
            <Label className="flex items-center text-base font-medium"><Target className="mr-2 h-4 w-4 text-primary"/> What are your key priorities?</Label>
            {renderSelectionCards(prioritiesOptions, orderData.needsAssessment?.priorities, (value) => handleNeedsAssessmentChange('priorities', value), 'priorities')}
          </div>
          <div>
            <Label className="flex items-center text-base font-medium"><Globe className="mr-2 h-4 w-4 text-primary"/> What is your primary region of operation?</Label>
            {renderSelectionCards(regionOptions, orderData.needsAssessment?.region, (value) => handleNeedsAssessmentChange('region', value), 'region')}
          </div>
          <div>
            <Label htmlFor="businessDescription" className="flex items-center text-base font-medium"><FileText className="mr-2 h-4 w-4 text-primary"/> Briefly describe your business (optional).</Label>
            <Textarea
              id="businessDescription"
              placeholder="Provide a short summary of your business activities and goals."
              value={orderData.needsAssessment?.businessDescription || ''}
              onChange={(e) => handleNeedsAssessmentChange('businessDescription', e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
           <div>
            <Label className="flex items-center text-base font-medium mb-2"><Building className="mr-2 h-4 w-4 text-primary"/> Do you require banking assistance?</Label>
            <div className="flex items-center space-x-3">
              <Switch
                id="bankingIntentSwitch"
                checked={orderData.needsAssessment?.bankingIntent === true}
                onCheckedChange={(checked) => handleNeedsAssessmentChange('bankingIntent', checked)}
              />
              <Label htmlFor="bankingIntentSwitch" className="font-normal">
                {orderData.needsAssessment?.bankingIntent ? "Yes, please provide banking assistance options." : "No, I do not require banking assistance at this time."}
              </Label>
            </div>
          </div>
        </div>
      </div>

      {aiRecommendation && (
        <Alert variant="default" className="bg-accent/50 border-accent">
          <Wand2 className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">AI Recommendation Received</AlertTitle>
          <AlertDescription>
            <p>Based on your input, we suggest considering:</p>
            <p><strong>Jurisdiction:</strong> {aiRecommendation.jurisdiction}</p>
            <p><strong>Company Type:</strong> {aiRecommendation.companyType}</p>
            <p><strong>Reasoning:</strong> {aiRecommendation.reasoning}</p>
            <p className="mt-2 text-sm">These will be considered in the next step where you select your services.</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end items-center mt-8 pt-6 border-t">
        <Button onClick={actionButtonOnClick} disabled={isActionButtonDisabled} className="w-full md:w-auto">
          {(isAiLoading || (isPending && recommendationStage === 'initial')) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {showWandIcon && !isAiLoading && !(isPending && recommendationStage === 'initial') && <Wand2 className="mr-2 h-4 w-4" />}
          {actionButtonText}
          {showChevronIcon && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Step1DefineConfigure;
    

    