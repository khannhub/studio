
'use client';

import React, { useState, useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { Input } from '@/components/ui/input';
import TypingText from '@/components/common/TypingText';
import { cn } from '@/lib/utils';

interface AnimatedPlaceholderInputProps extends Omit<ComponentPropsWithoutRef<typeof Input>, 'placeholder'> {
  animatedPlaceholder: string;
  placeholderTypingSpeed?: number;
}

const AnimatedPlaceholderInput: React.FC<AnimatedPlaceholderInputProps> = ({
  animatedPlaceholder,
  placeholderTypingSpeed = 60, // Adjusted speed for placeholder
  value,
  className,
  onFocus,
  onBlur,
  onChange,
  ...props
}) => {
  const [showAnimatedPlaceholder, setShowAnimatedPlaceholder] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  useEffect(() => {
    if (hasValue || isFocused) {
      setShowAnimatedPlaceholder(false);
    } else {
      setShowAnimatedPlaceholder(true);
    }
  }, [hasValue, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setShowAnimatedPlaceholder(false); // Hide placeholder immediately on focus
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // setShowAnimatedPlaceholder will be re-evaluated by useEffect
    onBlur?.(e);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (String(e.target.value).length > 0) {
      setShowAnimatedPlaceholder(false);
    }
    onChange?.(e);
  };

  return (
    <div className={cn("relative w-full h-10", className)}> {/* Ensure container has fixed height like input */}
      {showAnimatedPlaceholder && !hasValue && !isFocused && (
        <TypingText
          text={animatedPlaceholder}
          speed={placeholderTypingSpeed}
          as="div"
          className="absolute top-0 left-0 flex items-center px-3 text-base text-muted-foreground pointer-events-none h-full w-full"
        />
      )}
      <Input
        {...props}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn(
          "absolute top-0 left-0 w-full h-full z-10", // Input on top
           // Make placeholder transparent if our animated one is potentially showing
          (showAnimatedPlaceholder && !hasValue && !isFocused) ? "placeholder:text-transparent" : ""
        )}
        placeholder={(isFocused || hasValue) ? "" : animatedPlaceholder} // Static placeholder for accessibility / no-JS
      />
    </div>
  );
};
export default AnimatedPlaceholderInput;
