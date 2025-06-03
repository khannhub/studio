'use client';

import { Loader2 } from 'lucide-react';
import type { FC } from 'react';

interface GlobalLoadingOverlayProps {
    isLoading: boolean;
}

const GlobalLoadingOverlay: FC<GlobalLoadingOverlayProps> = ({ isLoading }) => {
    if (!isLoading) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl font-semibold text-primary-foreground">AI is working its magic...</p>
            <p className="text-sm text-primary-foreground/80">Please wait a moment.</p>
        </div>
    );
};

export default GlobalLoadingOverlay;