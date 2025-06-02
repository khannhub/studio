'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { StepComponentProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, ChevronRight, CreditCard, FileText, ListChecks, Loader2, Mail, Phone, Rocket } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';

const Step0Welcome: FC<StepComponentProps> = ({
    orderData,
    updateOrderData,
    goToNextStep,
    isLoading: isGlobalLoading,
    setIsLoading: setGlobalIsLoading,
}) => {
    const { toast } = useToast();
    const [email, setEmail] = useState(orderData.userEmail || '');
    const [phone, setPhone] = useState(orderData.userPhone || '');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const validateEmail = (emailToValidate: string) => {
        if (!emailToValidate) {
            setEmailError('Email is required.');
            return false;
        }
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailToValidate)) {
            setEmailError('Invalid email format.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePhone = (phoneToValidate: string) => {
        if (!phoneToValidate) {
            setPhoneError('Phone number is required.');
            return false;
        }
        // Basic phone validation regex (allows for international numbers, spaces, hyphens, parentheses)
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
        if (!phoneRegex.test(phoneToValidate)) {
            setPhoneError('Invalid phone number format.');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const handleProceed = () => {
        const isEmailValid = validateEmail(email);
        const isPhoneValid = validatePhone(phone);

        if (isEmailValid && isPhoneValid) {
            updateOrderData(prev => ({
                ...prev,
                userEmail: email,
                userPhone: phone,
            }));
            toast({
                title: "Ready to Launch!",
                description: "We've received your contact information. Next, tell us about your business aspirations!",
                variant: "default",
            });
            goToNextStep();
        } else {
            toast({
                title: "Validation Error",
                description: "Please correct the errors in the form before proceeding.",
                variant: "destructive",
            });
        }
    };

    const isButtonDisabled = isGlobalLoading || !email || !phone || !!emailError || !!phoneError;

    const wizardStepsOverview = [
        { name: "Define Needs", icon: <ListChecks className="h-6 w-6 text-primary" /> },
        { name: "Select Services", icon: <FileText className="h-6 w-6 text-primary" /> },
        { name: "Provide Details", icon: <Rocket className="h-6 w-6 text-primary" /> },
        { name: "Review & Pay", icon: <CreditCard className="h-6 w-6 text-primary" /> },
        { name: "Confirmation", icon: <CheckCircle className="h-6 w-6 text-primary" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 items-start">
                {/* Left Column: Reduced space-y, removed h-full */}
                <div className="flex flex-col space-y-4 md:space-y-6">
                    <div className="space-y-2 md:space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            <span className="block text-primary">Incorporate Your Business</span>
                            <span className="block text-primary">Globally, Intelligently.</span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                            To personalize your global business setup and prepare for our advisory service,
                            please provide your email and phone number.
                        </p>
                    </div>

                    <div className="space-y-3 md:space-y-4 mt-auto pt-3 md:pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
                                    <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" /> Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={cn("w-full", emailError && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) validateEmail(e.target.value);
                                    }}
                                    onBlur={() => validateEmail(email)}
                                />
                                {emailError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p>}
                            </div>

                            <div>
                                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
                                    <Phone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" /> Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    className={cn("w-full", phoneError && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                                    placeholder="(123) 456-7890"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        if (phoneError) validatePhone(e.target.value);
                                    }}
                                    onBlur={() => validatePhone(phone)}
                                />
                                {phoneError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{phoneError}</p>}
                            </div>
                        </div>

                        <div className="pt-2 md:pt-3">
                            <Button
                                onClick={handleProceed}
                                disabled={isButtonDisabled}
                                className="w-full sm:w-auto group text-base py-3 px-6 rounded-md shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
                            >
                                {isGlobalLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Get Started Now
                                        <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Video Placeholder using <video> tag */}
                <div className="flex items-start justify-center w-full">
                    <video
                        poster="https://placehold.co/1280x720/E0E0E0/BDBDBD?text=Instruction+Video+Placeholder&font=roboto"
                        controls
                        className="w-full rounded-lg shadow-xl aspect-video min-h-[280px] sm:min-h-[320px] md:min-h-[calc(100%-0px)]"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
};

export default Step0Welcome;