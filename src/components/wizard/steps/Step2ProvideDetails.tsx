'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { ShareholderType, type StepComponentProps, type OrderData, type Person, type ShareholderInfo, type Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, PlusCircle, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Step2ProvideDetails: FC<StepComponentProps> = ({ orderData, updateOrderData, goToNextStep, goToPrevStep, isLoading }) => {
  
  const handleInputChange = (section: keyof OrderData, field: string, value: string, index?: number) => {
    updateOrderData(prev => {
      const currentSectionData = prev[section];
      if (index !== undefined && Array.isArray(currentSectionData)) {
        const updatedArray = [...currentSectionData];
        updatedArray[index] = { ...updatedArray[index], [field]: value };
        return { ...prev, [section]: updatedArray };
      } else if (typeof currentSectionData === 'object' && currentSectionData !== null) {
        return { ...prev, [section]: { ...(currentSectionData as object), [field]: value } };
      }
      return prev; // Should not happen with correct usage
    });
  };

  const handleAddressChange = (section: 'deliveryAddress' | 'billingAddress', field: keyof Address, value: string) => {
    updateOrderData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Address),
        [field]: value,
      }
    }));
  };

  const addDirector = () => {
    updateOrderData(prev => ({
      directors: [...(prev.directors || []), { id: `dir-${Date.now()}` }]
    }));
  };
  const removeDirector = (index: number) => {
    updateOrderData(prev => ({
      directors: prev.directors?.filter((_, i) => i !== index)
    }));
  };

  const addShareholder = () => {
    updateOrderData(prev => ({
      shareholders: [...(prev.shareholders || []), { id: `sh-${Date.now()}`, type: ShareholderType.INDIVIDUAL }]
    }));
  };
  const removeShareholder = (index: number) => {
    updateOrderData(prev => ({
      shareholders: prev.shareholders?.filter((_, i) => i !== index)
    }));
  };

  const handleShareholderTypeChange = (index: number, type: ShareholderType) => {
    updateOrderData(prev => {
      const shareholders = [...(prev.shareholders || [])];
      shareholders[index] = { ...shareholders[index], type };
      return { ...prev, shareholders };
    });
  };


  return (
    <div className="space-y-8">
      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg font-semibold">Proposed Company Name(s)</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Provide up to three choices for your company name. We will check availability in order of preference.</p>
            <div>
              <Label htmlFor="companyName1">1st Choice</Label>
              <Input id="companyName1" value={orderData.companyNames?.firstChoice || ''} onChange={e => handleInputChange('companyNames', 'firstChoice', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="companyName2">2nd Choice (Optional)</Label>
              <Input id="companyName2" value={orderData.companyNames?.secondChoice || ''} onChange={e => handleInputChange('companyNames', 'secondChoice', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="companyName3">3rd Choice (Optional)</Label>
              <Input id="companyName3" value={orderData.companyNames?.thirdChoice || ''} onChange={e => handleInputChange('companyNames', 'thirdChoice', e.target.value)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-lg font-semibold">Director(s) Information</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6">
            {orderData.directors?.map((director, index) => (
              <Card key={director.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 px-4">
                  <CardTitle className="text-base">Director {index + 1}</CardTitle>
                  {index > 0 && <Button variant="ghost" size="icon" onClick={() => removeDirector(index)} className="h-7 w-7"><X className="h-4 w-4"/></Button>}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label htmlFor={`dirFullName${index}`}>Full Name</Label>
                    <Input id={`dirFullName${index}`} value={director.fullName || ''} onChange={e => handleInputChange('directors', 'fullName', e.target.value, index)} />
                  </div>
                   <div>
                    <Label htmlFor={`dirEmail${index}`}>Email</Label>
                    <Input id={`dirEmail${index}`} type="email" value={director.email || ''} onChange={e => handleInputChange('directors', 'email', e.target.value, index)} />
                  </div>
                  {/* Add more director fields as needed */}
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addDirector}><PlusCircle className="mr-2 h-4 w-4" /> Add Another Director</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-lg font-semibold">Shareholder(s) Information</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6">
            {orderData.shareholders?.map((shareholder, index) => (
              <Card key={shareholder.id} className="overflow-hidden">
                 <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 px-4">
                  <CardTitle className="text-base">Shareholder {index + 1}</CardTitle>
                  {index > 0 && <Button variant="ghost" size="icon" onClick={() => removeShareholder(index)} className="h-7 w-7"><X className="h-4 w-4"/></Button>}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <RadioGroup value={shareholder.type || ShareholderType.INDIVIDUAL} onValueChange={(value) => handleShareholderTypeChange(index, value as ShareholderType)} className="flex space-x-4 mb-3">
                    <div className="flex items-center space-x-2"><RadioGroupItem value={ShareholderType.INDIVIDUAL} id={`shTypeInd${index}`} /><Label htmlFor={`shTypeInd${index}`}>Individual</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value={ShareholderType.CORPORATE_ENTITY} id={`shTypeCorp${index}`} /><Label htmlFor={`shTypeCorp${index}`}>Corporate Entity</Label></div>
                  </RadioGroup>
                  {shareholder.type === ShareholderType.INDIVIDUAL ? (
                    <div>
                      <Label htmlFor={`shFullName${index}`}>Full Name</Label>
                      <Input id={`shFullName${index}`} value={shareholder.fullNameOrEntityName || ''} onChange={e => handleInputChange('shareholders', 'fullNameOrEntityName', e.target.value, index)} />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor={`shEntityName${index}`}>Corporate Entity Name</Label>
                      <Input id={`shEntityName${index}`} value={shareholder.fullNameOrEntityName || ''} onChange={e => handleInputChange('shareholders', 'fullNameOrEntityName', e.target.value, index)} />
                    </div>
                  )}
                   <div>
                    <Label htmlFor={`shShareAllocation${index}`}>Share Allocation / Percentage
                     <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0 text-muted-foreground"><Info className="h-3 w-3"/></Button></TooltipTrigger>
                          <TooltipContent><p>E.g., "100 shares" or "50%"</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input id={`shShareAllocation${index}`} value={shareholder.shareAllocation || ''} onChange={e => handleInputChange('shareholders', 'shareAllocation', e.target.value, index)} />
                  </div>
                  {/* Add more shareholder fields */}
                </CardContent>
              </Card>
            ))}
             <Button variant="outline" onClick={addShareholder}><PlusCircle className="mr-2 h-4 w-4" /> Add Another Shareholder</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-lg font-semibold">Primary Contact Person</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            {/* Pre-fill from Step 1 if available */}
            <div>
              <Label htmlFor="contactFullName">Full Name</Label>
              <Input id="contactFullName" value={orderData.primaryContact?.fullName || ''} onChange={e => handleInputChange('primaryContact', 'fullName', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" value={orderData.primaryContact?.email || orderData.userEmail || ''} onChange={e => handleInputChange('primaryContact', 'email', e.target.value)} />
            </div>
             <div>
              <Label htmlFor="contactPhone">Phone Number (Optional)</Label>
              <Input id="contactPhone" type="tel" value={orderData.primaryContact?.phone || ''} onChange={e => handleInputChange('primaryContact', 'phone', e.target.value)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-lg font-semibold">Delivery Address for Corporate Documents</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            {/* Standard address form. Consider Google Places API for autocomplete. */}
            <div><Label htmlFor="delStreet">Street Address</Label><Input id="delStreet" value={orderData.deliveryAddress?.street || ''} onChange={e => handleAddressChange('deliveryAddress', 'street', e.target.value)} /></div>
            <div><Label htmlFor="delCity">City</Label><Input id="delCity" value={orderData.deliveryAddress?.city || ''} onChange={e => handleAddressChange('deliveryAddress', 'city', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="delState">State/Province</Label><Input id="delState" value={orderData.deliveryAddress?.stateOrProvince || ''} onChange={e => handleAddressChange('deliveryAddress', 'stateOrProvince', e.target.value)} /></div>
              <div><Label htmlFor="delPostal">Postal Code</Label><Input id="delPostal" value={orderData.deliveryAddress?.postalCode || ''} onChange={e => handleAddressChange('deliveryAddress', 'postalCode', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="delCountry">Country</Label><Input id="delCountry" value={orderData.deliveryAddress?.country || ''} onChange={e => handleAddressChange('deliveryAddress', 'country', e.target.value)} /></div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger className="text-lg font-semibold">Extra Requests / Specific Instructions</AccordionTrigger>
          <AccordionContent className="pt-4">
            <Textarea
              placeholder="Any special requirements or instructions for your order?"
              value={orderData.extraRequests || ''}
              onChange={e => updateOrderData({extraRequests: e.target.value})}
              className="min-h-[100px]"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={goToPrevStep} disabled={isLoading}>
           <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={goToNextStep} disabled={isLoading}>
          Review &amp; Pay <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Step2ProvideDetails;
