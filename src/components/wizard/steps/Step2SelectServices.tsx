
'use client';

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import type { StepComponentProps, OrderData, AddOn, IncorporationDetails, BankingAssistance, OrderItem } from '@/lib/types';
import { INITIAL_ADDONS, JURISDICTIONS_LIST, US_STATES_LIST, COMPANY_TYPES_LIST } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, ChevronRight, ChevronLeft, Info, Building } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TypingText from '@/components/common/TypingText';
import { cn } from '@/lib/utils';

const incorporationPackages = [
  { name: 'Basic', price: 399, features: ['Company Registration', 'Registered Agent Service (1yr)', 'Standard Documents'] },
  { name: 'Standard', price: 699, features: ['All Basic Features', 'EIN Application Assistance', 'Corporate Kit'] },
  { name: 'Premium', price: 999, features: ['All Standard Features', 'Priority Processing', 'Bank Account Opening Support'] },
];

const Step2SelectServices: FC<StepComponentProps> = ({
  orderData,
  updateOrderData,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  goToNextStep,
  goToPrevStep,
  isLoading,
}) => {
  
  const localAddons = useMemo(() => {
    return orderData.addOns && orderData.addOns.length > 0 ? orderData.addOns : [...INITIAL_ADDONS];
  }, [orderData.addOns]);

  useEffect(() => {
    if (!orderData.addOns || orderData.addOns.length === 0) {
      updateOrderData({ addOns: [...INITIAL_ADDONS] });
    }
    if (orderData.needsAssessment?.bankingIntent && orderData.incorporation?.aiRecommendedReasoning && !orderData.bankingAssistance?.selected) {
        if (orderData.bankingAssistance?.reasoning) { // AI reasoning for banking
            handleBankingAssistSelect(true, orderData.bankingAssistance.reasoning);
        }
    }
  }, [orderData.addOns, updateOrderData, orderData.needsAssessment?.bankingIntent, orderData.incorporation?.aiRecommendedReasoning, orderData.bankingAssistance]);

  const updateIncorporationServiceOrderItem = (updatedIncorporationData: IncorporationDetails) => {
    const { packageName, price, jurisdiction, state, companyType, aiRecommendedReasoning } = updatedIncorporationData;
    if (packageName && price && price > 0) {
      const jurisdictionDisplay = jurisdiction || 'Selected Jurisdiction';
      const stateDisplay = jurisdiction === 'United States of America' && state ? ` (${state.split('-')[0]})` : '';
      const companyTypeDisplay = companyType || 'Company Type';
      
      const aiReasoningText = aiRecommendedReasoning 
          ? `Original AI Suggestion: ${updatedIncorporationData.aiRecommendedJurisdiction || ''}${updatedIncorporationData.aiRecommendedState ? ` (${updatedIncorporationData.aiRecommendedState.split('-')[0]})` : ''} ${updatedIncorporationData.aiRecommendedCompanyType || ''}. Reasoning: ${aiRecommendedReasoning.substring(0,70)}...` 
          : '';

      const itemName = `${jurisdictionDisplay}${stateDisplay} ${companyTypeDisplay} - ${packageName} Package`;
      const itemDescription = `Includes ${packageName} features. ${aiReasoningText}`.trim();

      const existingItem = orderData.orderItems?.find(item => item.id === 'incorporation_service');
      const itemPayload = {
          name: itemName,
          price: price,
          quantity: 1,
          description: itemDescription
      };

      if (existingItem) {
        updateOrderItem('incorporation_service', itemPayload);
      } else {
        addOrderItem({ id: 'incorporation_service', ...itemPayload });
      }
    } else if (orderData.orderItems?.find(item => item.id === 'incorporation_service')) {
        removeOrderItem('incorporation_service');
    }
  };
  
  const handleIncorporationFieldChange = (field: keyof IncorporationDetails, value: string) => {
    updateOrderData(prev => {
      const newIncorporationData = {
        ...prev.incorporation,
        [field]: value,
      };
      // Clear state if jurisdiction is not USA
      if (field === 'jurisdiction' && value !== 'United States of America') {
        newIncorporationData.state = '';
      }
      updateIncorporationServiceOrderItem(newIncorporationData as IncorporationDetails);
      return { incorporation: newIncorporationData };
    });
  };

  const handleIncorporationPackageSelect = (packageName: string) => {
    const selectedPkg = incorporationPackages.find(pkg => pkg.name === packageName);
    if (selectedPkg) {
      updateOrderData(prev => {
        const newIncorporationData = {
            ...prev.incorporation,
            packageName: selectedPkg.name,
            price: selectedPkg.price,
        } as IncorporationDetails;
        updateIncorporationServiceOrderItem(newIncorporationData);
        return { incorporation: newIncorporationData };
      });
    }
  };

  const handleBankingAssistSelect = (selected: boolean, aiReasoningForBanking?: string) => {
    const defaultOption = "Standard Banking Assistance";
    let optionToShow = orderData.bankingAssistance?.option || defaultOption;
    
    if (selected && aiReasoningForBanking && !orderData.bankingAssistance?.option) {
        optionToShow = aiReasoningForBanking;
    } else if (!selected) {
        optionToShow = ''; 
    }

    const newBankingData: BankingAssistance = {
      ...orderData.bankingAssistance,
      selected: selected,
      price: selected ? 250 : 0, 
      option: optionToShow,
      reasoning: selected ? (orderData.bankingAssistance?.reasoning || aiReasoningForBanking) : undefined,
    };
    updateOrderData({ bankingAssistance: newBankingData });

    if (selected) {
      const existingItem = orderData.orderItems?.find(item => item.id === 'banking_assistance');
      const itemPayload = { id: 'banking_assistance', name: 'Banking Assistance', price: newBankingData.price!, quantity: 1, description: newBankingData.option };
      if(existingItem) {
        updateOrderItem('banking_assistance', itemPayload);
      } else {
        addOrderItem(itemPayload);
      }
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

  const isProceedButtonDisabled = isLoading || !orderData.incorporation?.packageName || !orderData.incorporation?.jurisdiction || !orderData.incorporation?.companyType || (orderData.incorporation.jurisdiction === 'United States of America' && !orderData.incorporation.state);

  return (
    <div className="space-y-8">
      {orderData.incorporation?.aiRecommendedReasoning && (
        <Alert variant="default" className="bg-accent/50 border-accent mt-0">
          <Wand2 className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">AI Recommendation</AlertTitle>
          <AlertDescription>
            <p>Based on your input, our AI suggests considering:</p>
            <p><strong>Jurisdiction:</strong> {orderData.incorporation.aiRecommendedJurisdiction}</p>
            {orderData.incorporation.aiRecommendedJurisdiction === 'United States of America' && orderData.incorporation.aiRecommendedState && (
              <p><strong>State:</strong> {orderData.incorporation.aiRecommendedState.split('-')[0]}</p>
            )}
            <p><strong>Company Type:</strong> {orderData.incorporation.aiRecommendedCompanyType}</p>
            <p><strong>Reasoning:</strong> {orderData.incorporation.aiRecommendedReasoning}</p>
            <p className="mt-2 text-sm">You can adjust these selections below or proceed with these suggestions.</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <TypingText text="Select Your Incorporation Details" speed={25} as="span" className="flex items-center" />
          </CardTitle>
          <CardDescription>Choose your jurisdiction, company type, and desired package.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select
                value={orderData.incorporation?.jurisdiction || ''}
                onValueChange={(value) => handleIncorporationFieldChange('jurisdiction', value)}
              >
                <SelectTrigger id="jurisdiction" className="w-full mt-1">
                  <SelectValue placeholder="Select Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS_LIST.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {orderData.incorporation?.jurisdiction === 'United States of America' && (
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={orderData.incorporation?.state || ''}
                  onValueChange={(value) => handleIncorporationFieldChange('state', value)}
                >
                  <SelectTrigger id="state" className="w-full mt-1">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="companyType">Company Type</Label>
              <Select
                value={orderData.incorporation?.companyType || ''}
                onValueChange={(value) => handleIncorporationFieldChange('companyType', value)}
              >
                <SelectTrigger id="companyType" className="w-full mt-1">
                  <SelectValue placeholder="Select Company Type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES_LIST.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                </SelectContent>
              </Select>
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
                <Label 
                  key={pkg.name} 
                  htmlFor={pkg.name} 
                  className={cn(
                    "flex flex-col items-start cursor-pointer rounded-lg border p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl", 
                    orderData.incorporation?.packageName === pkg.name ? 'border-primary ring-2 ring-primary bg-primary/10 shadow-md' : 'bg-card border-border hover:border-primary/70'
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
        </CardContent>
      </Card>

      {orderData.needsAssessment?.bankingIntent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Banking Assistance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch 
                id="bankingAssistSwitch" 
                checked={orderData.bankingAssistance?.selected || false} 
                onCheckedChange={(checked) => handleBankingAssistSelect(checked, orderData.bankingAssistance?.reasoning)} 
              />
              <Label htmlFor="bankingAssistSwitch">Add Banking Assistance ($250)</Label>
            </div>
            {orderData.bankingAssistance?.selected && orderData.bankingAssistance.reasoning && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-accent/20 rounded-md">
                Note: {orderData.bankingAssistance.reasoning}
              </p>
            )}
             {orderData.bankingAssistance?.selected && !orderData.bankingAssistance.reasoning && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-accent/20 rounded-md">
                Standard banking assistance package selected.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <TypingText text="Popular Add-ons" speed={25} as="span" />
          </CardTitle>
          <CardDescription>Consider these popular services for your new company.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {localAddons.map(addon => ( 
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
          </div>
        </CardContent>
      </Card>

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
