import type { FC } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OrderItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface OrderSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
}

const OrderSummary: FC<OrderSummaryProps> = ({ isOpen, onClose, items }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle>Order Summary</SheetTitle>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6 mb-4"> {/* Added padding for scrollbar */}
          {items.length === 0 ? (
            <p className="text-muted-foreground">Your order is currently empty.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between items-start text-sm p-3 bg-accent/30 rounded-md">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                     {item.quantity > 1 && <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>}
                  </div>
                  <p className="font-semibold text-foreground whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <SheetFooter className="mt-auto">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Due:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={onClose} disabled={items.length === 0}>
              Continue Order
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OrderSummary;
