
'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements; // Allow specifying the HTML tag
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 30, className, style, as = 'span' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text prop changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text) { // Handle empty or undefined text
      setDisplayedText('');
      return;
    }

    if (currentIndex < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, text, speed]);

  const Tag = as;

  return <Tag className={className} style={style}>{displayedText}</Tag>;
};

export default TypingText;
