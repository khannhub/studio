
'use client';

import type { FC } from 'react';
import type { StepComponentProps, OrderData, OrderItem, Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
import { Edit3, CreditCard, Landmark, Lock, ChevronRight, ChevronLeft } from 'lucide-react'; // Assuming PayPal icon is not in lucide
// import Image from 'next/image'; // For PayPal logo if needed - not used for now

const Step3ReviewPay: FC<StepComponentProps> = ({ orderData, updateOrderData, orderItems, goToNextStep, goToPrevStep, goToStep, isLoading }) => {

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleBillingAddressChange = (field: keyof Address, value: string) => {
    updateOrderData(prev => ({
      billingAddress: {
        ...(prev.billingAddress as Address),
        [field]: value,
        useDeliveryAddress: false, // uncheck if typing manually
        usePrimaryContactAddress: false,
      }
    }));
  };

  const handleUseDeliveryAddress = (checked: boolean) => {
    updateOrderData(prev => ({
      billingAddress: {
        ...(checked ? prev.deliveryAddress : {
          street: '', city: '', stateOrProvince: '', postalCode: '', country: '' // Clear if unchecked
        }),
        useDeliveryAddress: checked,
        usePrimaryContactAddress: checked ? false : prev.billingAddress?.usePrimaryContactAddress,
      }
    }));
  };
  
  const handleUsePrimaryContactAddress = (checked: boolean) => {
     updateOrderData(prev => ({
      billingAddress: {
        street: checked && prev.primaryContact?.email ? "123 Contact St (Mock)" : "", // Mocked logic
        city: checked ? "Contactville (Mock)" : "",
        stateOrProvince: checked ? "Contact State (Mock)" : "",
        postalCode: checked ? "00000 (Mock)" : "",
        country: checked ? "Contactland (Mock)" : "",
        usePrimaryContactAddress: checked,
        useDeliveryAddress: checked ? false : prev.billingAddress?.useDeliveryAddress,
      }
    }));
  };


  const handlePaymentMethodChange = (method: "card" | "paypal" | "bank_transfer") => {
    updateOrderData({ paymentMethod: method });
  };
  
  const handleEditSection = (step: number) => {
    // Step mapping:
    // Define Needs -> Step 1
    // Select Services -> Step 2
    // Provide Details -> Step 3
    // This review step is Step 4.
    // If editing order details, go to step 2 (Select Services) or step 3 (Provide Details)
    // For now, let's make "Edit Order" go to Step 2 (Select Services)
    // and they can navigate from there.
    goToStep(step); 
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Review Your Order</CardTitle>
            {/* Edit Order button now takes to Step 2 (Select Services) */}
            <Button variant="outline" size="sm" onClick={() => handleEditSection(2)}><Edit3 className="mr-2 h-4 w-4" /> Edit Services</Button>
          </div>
          <CardDescription>Please check your selections carefully before proceeding to payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-md">
              <div>
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                {item.quantity > 1 && <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>}
              </div>
              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-xl font-bold text-primary">
            <span>Final Total Amount Due:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
           <div className="mt-4">
             <Button variant="link" onClick={() => handleEditSection(3)} className="p-0 h-auto text-sm">
               <Edit3 className="mr-1 h-3 w-3" /> Edit Company & Contact Details
             </Button>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="useDelivery" checked={orderData.billingAddress?.useDeliveryAddress || false} onCheckedChange={handleUseDeliveryAddress} />
              <Label htmlFor="useDelivery">Use Delivery Address</Label>
            </div>
            {/* <div className="flex items-center space-x-2">
              <Checkbox id="useContact" checked={orderData.billingAddress?.usePrimaryContactAddress || false} onCheckedChange={handleUsePrimaryContactAddress} />
              <Label htmlFor="useContact">Use Primary Contact Address (Mock)</Label>
            </div> */}
          </div>
          {!(orderData.billingAddress?.useDeliveryAddress) && !(orderData.billingAddress?.usePrimaryContactAddress) && (
            <>
              <div><Label htmlFor="billStreet">Street Address</Label><Input id="billStreet" value={orderData.billingAddress?.street || ''} onChange={e => handleBillingAddressChange('street', e.target.value)} /></div>
              <div><Label htmlFor="billCity">City</Label><Input id="billCity" value={orderData.billingAddress?.city || ''} onChange={e => handleBillingAddressChange('city', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="billState">State/Province</Label><Input id="billState" value={orderData.billingAddress?.stateOrProvince || ''} onChange={e => handleBillingAddressChange('stateOrProvince', e.target.value)} /></div>
                <div><Label htmlFor="billPostal">Postal Code</Label><Input id="billPostal" value={orderData.billingAddress?.postalCode || ''} onChange={e => handleBillingAddressChange('postalCode', e.target.value)} /></div>
              </div>
              <div><Label htmlFor="billCountry">Country</Label><Input id="billCountry" value={orderData.billingAddress?.country || ''} onChange={e => handleBillingAddressChange('country', e.target.value)} /></div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={orderData.paymentMethod} 
            onValueChange={(value) => handlePaymentMethodChange(value as "card" | "paypal" | "bank_transfer")}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Label htmlFor="payCard" className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary ${orderData.paymentMethod === 'card' ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="card" id="payCard" className="sr-only" />
              <CreditCard className="h-8 w-8 mb-2" /> Visa/Mastercard
            </Label>
            <Label htmlFor="payPayPal" className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary ${orderData.paymentMethod === 'paypal' ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="paypal" id="payPayPal" className="sr-only" />
              <svg className="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.064 16.85 7.064 16.85C16.13 5.964 14.937 5.11 13.63 5.11H7.064V1ZM7.064 16.85V20.01H11.02C13.061 20.01 14.571 18.666 14.571 16.85C14.571 15.035 13.061 13.69 11.02 13.69H7.064V16.85Z M14.8 8.394C14.8 7.277 14.046 6.6 12.982 6.6H8.987V12.201H12.982C14.046 12.201 14.8 11.524 14.8 10.407V8.394Z M18.964 8.782C18.818 7.79 17.484 6.91 15.95 6.91H15.47V7.852H15.95C17.014 7.852 17.622 8.291 17.768 8.978C17.902 9.615 17.56 10.143 16.976 10.44L18.348 12.77H17.052L15.902 10.89C15.902 10.89 15.47 13.09 15.47 13.09H14.508L15.058 7.018C15.058 7.018 15.104 6.986 15.104 6.986L15.104 5.11H19.23C20.326 5.11 21.112 5.76 20.934 6.986C20.768 8.224 19.688 8.718 18.964 8.782Z"/></svg>
              PayPal
            </Label>
             <Label htmlFor="payBank" className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary ${orderData.paymentMethod === 'bank_transfer' ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="bank_transfer" id="payBank" className="sr-only" />
              <Landmark className="h-8 w-8 mb-2" /> Bank Transfer
            </Label>
          </RadioGroup>

          {orderData.paymentMethod === 'card' && (
            <div className="space-y-3 pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground flex items-center"><Lock className="h-4 w-4 mr-2 text-green-600"/> Secure Card Payment</p>
              <div><Label htmlFor="cardNumber">Card Number</Label><Input id="cardNumber" placeholder="•••• •••• •••• ••••" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="expiryDate">Expiry Date</Label><Input id="expiryDate" placeholder="MM/YY" /></div>
                <div><Label htmlFor="cvv">CVV</Label><Input id="cvv" placeholder="•••" /></div>
              </div>
            </div>
          )}
          {orderData.paymentMethod === 'bank_transfer' && (
            <div className="pt-4 border-t mt-4 space-y-2 bg-accent/30 p-4 rounded-md">
              <h4 className="font-semibold">Bank Transfer Instructions:</h4>
              <p className="text-sm"><strong>Bank Name:</strong> Global IBC Bank</p>
              <p className="text-sm"><strong>Account Number:</strong> 1234567890</p>
              <p className="text-sm"><strong>SWIFT/BIC:</strong> GIBCXXYY</p>
              <p className="text-sm"><strong>Reference Code:</strong> Use your Order ID (will be generated)</p>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("Bank: Global IBC Bank, Acc: 1234567890, SWIFT: GIBCXXYY")}>Copy Details</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={goToPrevStep} disabled={isLoading}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={() => {
          // Simulate generating an order ID and successful payment
          const newOrderId = `IBC-${Date.now()}`;
          updateOrderData(prev => ({ 
            ...prev, 
            orderId: newOrderId, 
            orderStatus: 'success',
            paymentDate: new Date().toISOString(), // Record payment date
          }));
          goToNextStep();
        }} disabled={isLoading || !orderData.paymentMethod || totalAmount === 0}>
          Pay ${totalAmount.toFixed(2)} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Step3ReviewPay;
