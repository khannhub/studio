'use client';

import type { OrderItem } from '@/lib/types';
import { STEPS } from '@/lib/types'; // Import STEPS to get total length for last step calculation
import type { FC, ReactNode } from 'react';
import GlobalLoadingOverlay from '../common/GlobalLoadingOverlay'; // Import the new component
import AppHeader from './AppHeader';
import OrderSummary from './OrderSummary';
import ProgressBar from './ProgressBar';

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number; // This is 1-indexed as adjusted before for ProgressBar
  totalSteps: number;
  stepNames: string[];
  orderItems: OrderItem[];
  appTitle?: string;
  onLogoClick?: () => void;
  isGlobalLoading?: boolean; // Add new prop for global loading state
}

const WizardLayout: FC<WizardLayoutProps> = ({
  children,
  currentStep, // Remember: This is 1-indexed (e.g., 1 for Welcome, 2 for Define Needs)
  totalSteps,
  stepNames,
  orderItems,
  appTitle = "IBC Swift Start",
  onLogoClick,
  isGlobalLoading = false, // Destructure with a default value
}) => {
  // Convert 1-indexed currentStep from props to 0-indexed for logic
  const currentStepZeroIndexed = currentStep - 1;

  const lastStepZeroIndexed = STEPS.length - 1;
  const stepsToExpand = [0, 1, lastStepZeroIndexed]; // Welcome, Define Needs, Confirmation

  const shouldExpandWizard = stepsToExpand.includes(currentStepZeroIndexed);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <GlobalLoadingOverlay isLoading={isGlobalLoading} /> {/* Render the overlay */}
      <AppHeader
        title={appTitle}
        onLogoClick={onLogoClick}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} stepNames={stepNames} />
        <div className="flex flex-col lg:flex-row gap-8 w-full mt-8">
          <div
            className={shouldExpandWizard
              ? "w-full max-w-5xl mx-auto"
              : "lg:w-2/3 w-full"}
          >
            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl overflow-y-auto">
              {children}
            </div>
          </div>

          {!shouldExpandWizard && (
            <div className="lg:w-1/3 w-full lg:sticky lg:top-24 self-start">
              <OrderSummary
                items={orderItems}
                alwaysShow={true}
              />
            </div>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} IBC Swift Start. All rights reserved.
      </footer>
    </div>
  );
};

export default WizardLayout;
