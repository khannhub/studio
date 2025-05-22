'use client';

import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import AppHeader from './AppHeader';
import ProgressBar from './ProgressBar';
import OrderSummary from './OrderSummary';
import type { OrderItem } from '@/lib/types';

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  orderItems: OrderItem[];
  appTitle?: string;
}

const WizardLayout: FC<WizardLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  stepNames,
  orderItems,
  appTitle = "IBC Swift Start",
}) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader
        title={appTitle}
        onToggleSummary={() => setIsSummaryOpen(true)}
        orderItemCount={orderItems.filter(item => item.quantity > 0).length}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} stepNames={stepNames} />
          <div className="mt-8 bg-card p-6 sm:p-8 rounded-xl shadow-xl">
            {children}
          </div>
        </div>
      </main>
      <OrderSummary
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        items={orderItems}
      />
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} IBC Swift Start. All rights reserved.
      </footer>
    </div>
  );
};

export default WizardLayout;
