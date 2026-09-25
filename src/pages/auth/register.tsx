import { goToLanding } from "@/lib/links";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@pacific-code-labs/ujto-ds";
import { useLanguage } from "@pacific-code-labs/ujto-ds";

import { Button } from "@pacific-code-labs/ujto-ds";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@pacific-code-labs/ujto-ds";
import { Input } from "@pacific-code-labs/ujto-ds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pacific-code-labs/ujto-ds";
import { ProgressSteps } from "@pacific-code-labs/ujto-ds";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { LanguageToggle } from "@/components/layout/toggles";
import { ThemeToggle } from "@/components/layout/toggles";
import { Home, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { BrandStoryPanel } from "@/components/auth/BrandStoryPanel";

// AWS Cognito password policy: min 8 chars, uppercase, lowercase, number, special char
const passwordSchema = z.string()
  .min(8, 'validation.passwordMin')
  .regex(/[a-z]/, 'validation.passwordLower')
  .regex(/[A-Z]/, 'validation.passwordUpper')
  .regex(/[0-9]/, 'validation.passwordNumber')
  .regex(/[^a-zA-Z0-9]/, 'validation.passwordSpecial');

const step1Schema = z.object({
  firstName: z.string().min(1, 'validation.firstNameRequired'),
  lastName: z.string().min(1, 'validation.lastNameRequired'),
  email: z.string().email('validation.emailInvalid'),
  username: z.string().min(3, 'validation.usernameMin').max(20, 'validation.usernameMax'),
});

const step2Schema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "validation.passwordsMismatch",
  path: ["confirmPassword"],
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

const registrationSteps = [
  { id: 'info', title: '', description: '' },
  { id: 'password', title: '', description: '' },
  { id: 'verify', title: '', description: '' }
];

export default function Register() {
  const [, navigate] = useLocation();
  const { register, forceLogout } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<'info' | 'password' | 'verify'>('info');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Create localized steps
  const localizedSteps = [
    { id: 'info', title: t('auth.register.steps.personalInfo'), description: t('auth.register.steps.personalInfoDesc') },
    { id: 'password', title: t('auth.register.steps.security'), description: t('auth.register.steps.securityDesc') },
    { id: 'verify', title: t('auth.register.steps.verify'), description: t('auth.register.steps.verifyDesc') }
  ];

  // Step 1 form (Personal Info)
  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
    },
  });

  // Step 2 form (Password)
  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const currentPassword = step2Form.watch('password') || '';

  // Force logout when registration page loads to clear any stale sessions
  useEffect(() => {
    const cleanSession = async () => {
      console.log('🔄 Cleaning session on registration page load');
      await forceLogout();
    };
    cleanSession();
  }, [forceLogout]);

  const handleStep1Submit = (values: Step1Form) => {
    setStep1Data(values);
    setCompletedSteps(['info']);
    setCurrentStep('password');
  };

  const handleStep2Submit = async (values: Step2Form) => {
    if (!step1Data) {
      toast({
        title: t('common.error'),
        description: t('auth.register.completeStep1'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const fullRegistrationData = {
        ...step1Data,
        ...values,
      };

      const result = await register.mutateAsync(fullRegistrationData);
      
      setCompletedSteps(['info', 'password']);
      
      // Check if verification is needed
      if (result?.needsVerification) {
        setCurrentStep('verify');
        
        // Store verification data in session storage instead of URL parameters
        sessionStorage.setItem('verificationData', JSON.stringify({
          email: step1Data.email,
          password: values.password,
          timestamp: Date.now()
        }));
        
        toast({
          title: t('auth.register.success.title'),
          description: t('auth.register.success.description'),
        });
        navigate(`/verify-email`);
      } else {
        // Registration complete, redirect to dashboard
        setCompletedSteps(['info', 'password', 'verify']);
        navigate("/");
        toast({
          title: t('auth.register.complete.title'),
          description: t('auth.register.complete.description'),
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('auth.register.error'),
        variant: 'destructive',
      });
    }
  };

  const goBackToStep1 = () => {
    setCurrentStep('info');
    setCompletedSteps([]);
  };

  // Pre-populate step1 form if we have data and user goes back
  useEffect(() => {
    if (step1Data && currentStep === 'info') {
      step1Form.reset(step1Data);
    }
  }, [step1Data, currentStep, step1Form]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={() => goToLanding(language)}
      >
        <Home className="w-4 h-4 mr-2" />
        {t('navigation.backToHome')}
      </Button>

      {/* Language and Theme Toggles */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-2 items-stretch mt-16 mb-4">
        {/* Form first on phones; story beside it on large screens */}
        <div className="order-last lg:order-first">
          <BrandStoryPanel />
        </div>
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {t('auth.register.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.register.description')}
            </CardDescription>
          </div>
          
          {/* Progress Steps */}
          <ProgressSteps
            steps={localizedSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 'info' && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={step1Form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.register.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.register.firstNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={step1Form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.register.lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('auth.register.lastNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('auth.register.emailPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('auth.register.usernamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('auth.register.continue')}
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Password Setup */}
          {currentStep === 'password' && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.register.passwordPlaceholder')}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Strength Indicator */}
                {currentPassword && (
                  <PasswordStrengthIndicator password={currentPassword} className="mt-4" />
                )}
                
                <FormField
                  control={step2Form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t('auth.register.confirmPasswordPlaceholder')}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goBackToStep1}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.register.back')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={register.isPending}
                  >
                    {register.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('auth.register.createAccount')}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Sign In Link */}
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {t('auth.register.hasAccount')}{' '}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => navigate(`/login`)}
            >
              {t('auth.register.signIn')}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}