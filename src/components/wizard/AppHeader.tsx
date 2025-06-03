import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Save } from 'lucide-react';
import Image from 'next/image';
import type { FC, KeyboardEvent } from 'react';

interface AppHeaderProps {
  title: string;
  onLogoClick?: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ title, onLogoClick }) => {
  const { toast } = useToast();
  const logoUrl = "https://d21l9vkgwnizti.cloudfront.net/uploads/one-ibc-logo.svg";

  const handleSaveExit = () => {
    // In a real app, this would trigger saving state to backend
    toast({
      title: "Progress Saved (Mock)",
      description: "Your current progress has been mocked as saved.",
    });
  };

  const handleLogoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onLogoClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); // Prevent default space scroll
      onLogoClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div
            onClick={onLogoClick}
            onKeyDown={handleLogoKeyDown}
            role="button"
            tabIndex={onLogoClick ? 0 : -1}
            aria-label="Go to homepage"
            className={onLogoClick ? 'cursor-pointer' : ''}
          >
            <Image src={logoUrl} alt="One IBC Logo" width={120} height={32} priority className="h-8 w-auto" />
          </div>
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
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
