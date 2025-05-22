import type { FC } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

const ProgressBar: FC<ProgressBarProps> = ({ currentStep, totalSteps, stepNames }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center space-x-2 md:space-x-4">
        {stepNames.map((name, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <li key={name} className={cn("flex-1", index < totalSteps -1 ? "relative pr-8 sm:pr-12" : "")}>
              <div className="flex items-center text-sm font-medium">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isCompleted ? 'bg-primary text-primary-foreground' : '',
                    isActive ? 'border-2 border-primary text-primary' : '',
                    !isCompleted && !isActive ? 'border-2 border-border text-muted-foreground' : ''
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span>{stepNumber}</span>}
                </span>
                <span
                  className={cn(
                    "ml-3 hidden text-sm font-medium md:inline-block",
                    isActive ? 'text-primary' : '',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {name}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className="absolute inset-0 top-4 left-4 -z-10 hidden h-0.5 w-full bg-gray-200 md:block" aria-hidden="true">
                  <div 
                    className="h-0.5 bg-primary" 
                    style={{ width: isCompleted || isActive ? '100%' : '0%' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressBar;
