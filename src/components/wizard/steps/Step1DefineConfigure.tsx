'use client';

import { generateRecommendationIntro, type GenerateRecommendationIntroInput, type GenerateRecommendationIntroOutput } from '@/ai/flows/generate-recommendation-intro';
import { recommendIncorporation, type RecommendIncorporationInput, type RecommendIncorporationOutput } from '@/ai/flows/recommend-incorporation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { IncorporationDetails, IncorporationRecommendationItem, NeedsAssessment, StepComponentProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Banknote, Briefcase, Building, CandlestickChart, ChevronLeft, ChevronRight, Coins, Container, Copyright, Landmark as EuropeLandmark, EyeOff, Flag, Globe, LibraryBig, Loader2, MountainSnow, Palmtree, PiggyBank, PlaneTakeoff, Pyramid, ShieldCheck, ShoppingCart, SlidersHorizontal, Sprout, Target as TargetIcon, Users as UsersIcon, Wand2, Wheat } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useState, useTransition } from 'react';

const regionOptions = [
  { id: 'usa_exclusive', value: 'USA (Exclusive Focus)', label: 'USA (Exclusive Focus)', icon: <Flag className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'north_america', value: 'North America', label: 'North America (incl. Canada, Mexico)', icon: <MountainSnow className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'europe', value: 'Europe', label: 'Europe', icon: <EuropeLandmark className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'asia_pacific', value: 'Asia-Pacific', label: 'Asia-Pacific', icon: <Palmtree className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'south_asia', value: 'South Asia', label: 'South Asia', icon: <Wheat className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'latam_caribbean', value: 'Latin America & Caribbean', label: 'Latin America & Caribbean', icon: <Sprout className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'mena', value: 'Middle East & Africa', label: 'Middle East & Africa', icon: <Pyramid className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'global_other', value: 'Global / Multi-Region / Other', label: 'Global / Multi-Region / Other', icon: <Globe className="h-5 w-5 mb-2 text-primary" /> },
];

const businessActivityOptions = [
  { id: 'trading_goods', value: 'International Goods Trading', label: 'Goods Trading', icon: <Container className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'consulting', value: 'Consulting & Professional Services', label: 'Consulting/Services', icon: <UsersIcon className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'investment_holding', value: 'Investment & Asset Holding', label: 'Investment/Holding', icon: <LibraryBig className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'ip_licensing', value: 'Intellectual Property (IP) Licensing', label: 'IP Licensing', icon: <Copyright className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'ecommerce', value: 'E-commerce & Online Services', label: 'E-commerce/Online', icon: <ShoppingCart className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'treasury_financing', value: 'Group Treasury/Financing', label: 'Treasury/Financing', icon: <CandlestickChart className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'wealth_management', value: 'Personal Wealth Management', label: 'Wealth Management', icon: <PiggyBank className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_activity', value: 'Other Business Activity', label: 'Other Activity', icon: <Briefcase className="h-5 w-5 mb-2 text-primary" /> },
];

const strategicObjectiveOptions = [
  { id: 'tax_optimization', value: 'Tax Optimization / Efficiency', label: 'Tax Optimization', icon: <TargetIcon className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'asset_protection', value: 'Asset Protection / Risk Mitigation', label: 'Asset Protection', icon: <ShieldCheck className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'market_access_trade', value: 'Global Market Access / Trade', label: 'Market Access/Trade', icon: <PlaneTakeoff className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'investment_centralization', value: 'Investment Centralization', label: 'Investment Hub', icon: <Coins className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'admin_simplification', value: 'Administrative Simplification', label: 'Admin Simplicity', icon: <SlidersHorizontal className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'privacy_confidentiality', value: 'Privacy & Confidentiality', label: 'Privacy', icon: <EyeOff className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'access_banking', value: 'Access Specific Banking', label: 'Banking Access', icon: <Banknote className="h-5 w-5 mb-2 text-primary" /> },
  { id: 'other_objective', value: 'Other Strategic Objective', label: 'Other Objective', icon: <Building className="h-5 w-5 mb-2 text-primary" /> },
];

const assignStaticPriceToRecommendation = (rec: Omit<IncorporationRecommendationItem, 'price'>): number => {
  // Example static pricing logic. In a real app, this would come from a database or config.
  if (rec.jurisdiction === 'United States of America') {
    if (rec.state === 'Delaware-DE' && rec.companyType === 'Limited Liability Company') return 199;
    if (rec.state === 'Wyoming-WY' && rec.companyType === 'Limited Liability Company') return 149;
    if (rec.state === 'California-CA' && rec.companyType === 'C Corporation') return 299;
    return 249; // Default for other US states/types
  }
  if (rec.jurisdiction === 'Singapore' && rec.companyType === 'Private Limited Company') return 499;
  if (rec.jurisdiction === 'British Virgin Islands' && rec.companyType === 'International Business Company') return 799;
  if (rec.jurisdiction === 'Hong Kong' && rec.companyType === 'Limited by Shares') return 650;

  return 399; // Default for other international jurisdictions/types
};


const Step1DefineConfigure: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  goToNextStep,
  goToPrevStep,
  isLoading: isGlobalLoading,
  setIsLoading: setGlobalIsLoading,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastSuccessfulAiCallInputs, setLastSuccessfulAiCallInputs] = useState<Partial<NeedsAssessment> | null>(null);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleNeedsAssessmentChange = useCallback((field: keyof NeedsAssessment, value: string | string[]) => {
    updateOrderData(prev => ({
      needsAssessment: {
        ...(prev.needsAssessment as NeedsAssessment),
        [field]: value,
      },
    }));
  }, [updateOrderData]);

  const handleMultiSelectChange = (
    currentSelection: string[] | undefined,
    valueToToggle: string,
    field: 'businessActivities' | 'strategicObjectives'
  ) => {
    const newSelection = [...(currentSelection || [])];
    const index = newSelection.indexOf(valueToToggle);
    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push(valueToToggle);
    }
    handleNeedsAssessmentChange(field, newSelection);
  };


  const handleGetRecommendationAndProceed = () => {
    if (!orderData.needsAssessment?.region || (orderData.needsAssessment?.businessActivities || []).length === 0 || (orderData.needsAssessment?.strategicObjectives || []).length === 0) {
      toast({
        title: "Hold Up!",
        description: "Looks like we're missing some key details. Please tell us your target region, main business activities, and strategic goals.",
        variant: "destructive"
      });
      return;
    }

    const currentNeeds: Partial<NeedsAssessment> = {
      region: orderData.needsAssessment.region,
      businessActivities: orderData.needsAssessment.businessActivities,
      strategicObjectives: orderData.needsAssessment.strategicObjectives,
      businessDescription: orderData.needsAssessment.businessDescription,
    };

    const inputsHaveChangedOrNoRecExists =
      !lastSuccessfulAiCallInputs ||
      !orderData.incorporation?.aiRecommendedReasoning ||
      JSON.stringify(lastSuccessfulAiCallInputs) !== JSON.stringify(currentNeeds);

    if (!inputsHaveChangedOrNoRecExists && orderData.incorporation?.aiGeneratedIntroText) {
      // Skip AI calls if inputs haven't changed and recommendations + intro text exist
      goToNextStep();
      return;
    }

    setIsAiLoading(true);
    setGlobalIsLoading(true);

    startTransition(async () => {
      try {
        const recInput: RecommendIncorporationInput = {
          businessActivities: orderData.needsAssessment?.businessActivities || [],
          strategicObjectives: orderData.needsAssessment?.strategicObjectives || [],
          region: orderData.needsAssessment?.region || '',
          businessDescription: orderData.needsAssessment?.businessDescription || '',
        };

        let recommendations: RecommendIncorporationOutput;
        if (!inputsHaveChangedOrNoRecExists && orderData.incorporation?.aiBestRecommendation) {
          // Use existing recommendations if inputs haven't changed
          recommendations = {
            bestRecommendation: orderData.incorporation.aiBestRecommendation,
            alternativeRecommendations: orderData.incorporation.aiAlternativeRecommendations || [],
          };
        } else {
          recommendations = await recommendIncorporation(recInput);
        }

        const pricedBestRec = { ...recommendations.bestRecommendation, price: assignStaticPriceToRecommendation(recommendations.bestRecommendation) };
        const pricedAltRecs = recommendations.alternativeRecommendations.map(rec => ({ ...rec, price: assignStaticPriceToRecommendation(rec) }));

        const introInput: GenerateRecommendationIntroInput = {
          region: orderData.needsAssessment?.region,
          businessActivities: orderData.needsAssessment?.businessActivities,
          strategicObjectives: orderData.needsAssessment?.strategicObjectives,
        };
        const intro: GenerateRecommendationIntroOutput = await generateRecommendationIntro(introInput);

        updateOrderData(prev => {
          let newIncorporationDetails: IncorporationDetails = {
            ...(prev.incorporation as IncorporationDetails),
            jurisdiction: pricedBestRec.jurisdiction,
            state: pricedBestRec.state,
            companyType: pricedBestRec.companyType,
            price: pricedBestRec.price, // Base price from best recommendation

            aiBestRecommendation: pricedBestRec,
            aiAlternativeRecommendations: pricedAltRecs,

            aiRecommendedJurisdiction: pricedBestRec.jurisdiction, // Store original AI choices
            aiRecommendedState: pricedBestRec.state,
            aiRecommendedCompanyType: pricedBestRec.companyType,
            aiRecommendedReasoning: pricedBestRec.reasoning,
            aiGeneratedIntroText: intro.introText,
          };

          // If primary region is USA, ensure jurisdiction is set correctly
          if (recInput.region === 'USA (Exclusive Focus)') {
            newIncorporationDetails.jurisdiction = 'United States of America';
            // The state is already set by the AI recommendation or will be handled in Step 2
          }

          return {
            ...prev,
            incorporation: newIncorporationDetails,
          };
        });

        setLastSuccessfulAiCallInputs(currentNeeds);
        toast({
          title: "Insights Unlocked!",
          description: "Great! We've analyzed your needs and have some tailored incorporation suggestions for you. Let's explore them!"
        });
        goToNextStep();

      } catch (error) {
        console.error("Error during recommendation process:", error);
        toast({
          title: "Oops, a Hiccup!",
          description: "We hit a snag while generating recommendations. Please ensure all fields are filled correctly, or try rephrasing your business description. If the issue persists, our support team is ready to help!",
          variant: "destructive"
        });
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-2"
    >
      {options.map(option => (
        <Label
          key={option.id}
          htmlFor={`${groupName}-${option.id}`}
          className={cn(
            "flex flex-col items-center justify-center text-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out",
            "hover:-translate-y-1 hover:shadow-lg",
            selectedValue === option.value ? 'border-primary ring-2 ring-primary shadow-md' : 'border-border hover:border-primary/70'
          )}
        >
          <RadioGroupItem value={option.value} id={`${groupName}-${option.id}`} className="sr-only" />
          {option.icon}
          <span className="text-xs sm:text-sm font-medium leading-tight mt-1">{option.label}</span>
        </Label>
      ))}
    </RadioGroup>
  );

  const renderMultiSelectCards = (
    options: { id: string; value: string; label: string; icon?: JSX.Element }[],
    selectedValues: string[] | undefined,
    onChange: (value: string) => void,
    groupName: string
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
      {options.map(option => {
        const isSelected = (selectedValues || []).includes(option.value);
        return (
          <Label
            key={option.id}
            htmlFor={`${groupName}-${option.id}`}
            className={cn(
              "flex flex-col items-center justify-center text-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out",
              "hover:-translate-y-1 hover:shadow-lg",
              isSelected ? 'border-primary ring-2 ring-primary shadow-md' : 'border-border hover:border-primary/70'
            )}
          >
            <Checkbox
              id={`${groupName}-${option.id}`}
              checked={isSelected}
              onCheckedChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            <span className="text-xs sm:text-sm font-medium leading-tight mt-1">{option.label}</span>
          </Label>
        );
      })}
    </div>
  );


  const isEmailValid = orderData.userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.userEmail);
  const isPhoneValid = orderData.userPhone && orderData.userPhone.trim() !== '';
  const needsAssessment = orderData.needsAssessment || {};

  const isProceedButtonDisabled =
    isGlobalLoading ||
    isAiLoading ||
    isPending ||
    !needsAssessment.region ||
    (needsAssessment.businessActivities || []).length === 0 ||
    (needsAssessment.strategicObjectives || []).length === 0;

  return (
    <div className="space-y-8">
      <div className="space-y-6 py-2">
        <h2 className="text-xl font-semibold mb-1 flex items-center">
          Understanding Your Needs
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Tell us about your business to help us recommend the best options.</p>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">
              Primary target markets/regions?
            </Label>
            {renderSelectionCards(regionOptions, needsAssessment.region, (value) => handleNeedsAssessmentChange('region', value), 'region')}
          </div>

          <div>
            <Label className="text-base font-medium">
              Company's main business activity? (Select all that apply)
            </Label>
            {renderMultiSelectCards(businessActivityOptions, needsAssessment.businessActivities, (value) => handleMultiSelectChange(needsAssessment.businessActivities, value, 'businessActivities'), 'businessActivities')}
          </div>

          <div>
            <Label className="text-base font-medium">
              Main strategic objectives? (Select all that apply)
            </Label>
            {renderMultiSelectCards(strategicObjectiveOptions, needsAssessment.strategicObjectives, (value) => handleMultiSelectChange(needsAssessment.strategicObjectives, value, 'strategicObjectives'), 'strategicObjectives')}
          </div>

          <div>
            <Label htmlFor="businessDescription" className="text-base font-medium">
              Briefly describe your business (optional).
            </Label>
            <Textarea
              id="businessDescription"
              placeholder="Provide a short summary of your business activities and goals. If you selected 'Other' for business activity or objectives, please elaborate here."
              value={needsAssessment.businessDescription || ''}
              onChange={(e) => handleNeedsAssessmentChange('businessDescription', e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={goToPrevStep} disabled={isAiLoading || isPending || isGlobalLoading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleGetRecommendationAndProceed} disabled={isProceedButtonDisabled} className="w-full md:w-auto">
          {(isAiLoading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isAiLoading && !isPending && <Wand2 className="mr-2 h-4 w-4" />}
          Get Recommendations
          {!isAiLoading && !isPending && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Step1DefineConfigure;
