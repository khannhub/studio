import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { OrderItem } from '@/lib/types';
import type { FC } from 'react';

interface OrderSummaryProps {
  items: OrderItem[];
  alwaysShow?: boolean;
}

const OrderSummary: FC<OrderSummaryProps> = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Card className="shadow-lg rounded-xl flex flex-col h-full max-h-[calc(100vh-10rem)]">
      <CardHeader className="border-b">
        <CardTitle className="text-xl">Order Summary</CardTitle>
      </CardHeader>

      <ScrollArea className="flex-grow">
        <CardContent className="py-4 px-6">
          {items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">Your order is currently empty.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between items-start text-sm p-3 bg-muted/50 dark:bg-muted/20 rounded-lg shadow-sm">
                  <div>
                    <p className="font-medium text-foreground leading-tight">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    {item.quantity > 1 && <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.quantity}</p>}
                  </div>
                  <p className="font-semibold text-foreground whitespace-nowrap pl-3">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </ScrollArea>

      {items.length > 0 && (
        <>
          <Separator />
          <CardFooter className="py-4 px-6 mt-auto">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Due:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default OrderSummary;
