import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, HelpCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  title: string;
  onToggleSummary: () => void;
  orderItemCount: number;
}

const AppHeader: FC<AppHeaderProps> = ({ title, onToggleSummary, orderItemCount }) => {
  const { toast } = useToast();
  const logoUrl = "https://d21l9vkgwnizti.cloudfront.net/uploads/one-ibc-logo.svg";

  const handleSaveExit = () => {
    // In a real app, this would trigger saving state to backend
    toast({
      title: "Progress Saved (Mock)",
      description: "Your current progress has been mocked as saved.",
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Image src={logoUrl} alt="One IBC Logo" width={120} height={32} priority className="h-8 w-auto" />
          {/* <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1> */}
        </div>
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveExit}>
            <Save className="mr-2 h-4 w-4" />
            Save & Exit
          </Button>
          <Button variant="outline" size="icon" onClick={onToggleSummary} aria-label="View Order Summary" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {orderItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {orderItemCount}
              </span>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
