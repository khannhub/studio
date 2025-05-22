'use client';

import type { FC } from 'react';
import type { StepComponentProps, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Download, Printer, Mail, Phone } from 'lucide-react';

const Step4Confirmation: FC<StepComponentProps> = ({ orderData, orderItems }) => {
  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const statusConfig = {
    success: {
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
      title: "Payment Successful!",
      message: `Your One IBC Order ${orderData.orderId || ''} is Confirmed.`,
      variant: "default" as "default", // shadcn alert variant
    },
    pending: {
      icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
      title: "Order Submitted, Payment Pending.",
      message: `Payment for One IBC Order ${orderData.orderId || ''} is Pending Verification.`,
      variant: "default" as "default",
    },
    failed: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: "Payment Failed.",
      message: `Payment for One IBC Order ${orderData.orderId || ''} has failed. Please try again or contact support.`,
      variant: "destructive" as "destructive",
    },
  };

  const currentStatus = orderData.orderStatus || 'pending'; // Default to pending if not set
  const { icon, title, message } = statusConfig[currentStatus];

  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        {icon}
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-lg text-muted-foreground">{message}</p>
        {orderData.orderId && (
          <p className="text-sm">Order ID: <span className="font-semibold">{orderData.orderId}</span></p>
        )}
      </div>

      <Card className="text-left shadow-lg">
        <CardHeader>
          <CardTitle>Order Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span>{item.name}{item.quantity > 1 ? ` (x${item.quantity})` : ''}</span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Paid:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="text-left shadow-lg">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-disc list-inside text-muted-foreground">
            <li>Expect an email from your account manager within 24 business hours.</li>
            <li>Prepare your Know Your Customer (KYC) documents as outlined in our follow-up email.</li>
            <li>You will receive updates on your incorporation process periodically.</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF Receipt</Button>
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Confirmation</Button>
        </div>
        <div>
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-muted-foreground">Contact One IBC Support:</p>
            <div className="flex items-center justify-center space-x-4 mt-1">
                <a href="mailto:support@oneibc.com" className="flex items-center text-primary hover:underline">
                    <Mail className="mr-1 h-4 w-4" /> support@oneibc.com
                </a>
                <a href="tel:+1234567890" className="flex items-center text-primary hover:underline">
                    <Phone className="mr-1 h-4 w-4" /> +1 (234) 567-890
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Confirmation;
