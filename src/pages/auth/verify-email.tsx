import { goToLanding } from "@/lib/links";
import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
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
import { Icons } from "@/lib/ui-icons";
import { ProgressSteps } from "@pacific-code-labs/ujto-ds";
import { LanguageToggle } from "@/components/layout/toggles";
import { ThemeToggle } from "@/components/layout/toggles";
import { LogOut } from 'lucide-react';

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'validation.verificationCode'),
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const { verifyEmail, resendVerificationCode, logout } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    // Read verification data from session storage
    const verificationDataStr = sessionStorage.getItem('verificationData');
    if (verificationDataStr) {
      try {
        const verificationData = JSON.parse(verificationDataStr);
        const now = Date.now();
        
        // Check if data is not older than 30 minutes (for security)
        if (now - verificationData.timestamp < 30 * 60 * 1000) {
          setEmail(verificationData.email);
          setPassword(verificationData.password);
        } else {
          // Data expired, redirect to register
          sessionStorage.removeItem('verificationData');
          navigate(`/register`);
        }
      } catch (error) {
        console.error('Error parsing verification data:', error);
        navigate(`/register`);
      }
    } else {
      // No verification data, redirect to register
      navigate(`/register`);
    }
  }, [navigate, language]);

  const onSubmit = async (values: VerifyEmailForm) => {
    if (!email) return;

    verifyEmail.mutate({
      email,
      code: values.code,
      password: password,
    }, {
      onSuccess: () => {
        // Set flag to prevent session cleanup during auto-login
        sessionStorage.setItem('justVerified', 'true');
        
        // Clear session storage on successful verification
        sessionStorage.removeItem('verificationData');
        
        toast({
          title: t('auth.verify.success.title'),
          description: t('auth.verify.success.description'),
        });

        // Small delay to ensure authentication state updates properly
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      },
      onError: (error: any) => {
        toast({
          title: t('common.error'),
          description: error.message || t('auth.verify.error'),
          variant: 'destructive',
        });
      }
    });
  };

  const handleResendCode = async () => {
    if (!email) return;

    resendVerificationCode.mutate({ email }, {
      onSuccess: () => {
        toast({
          title: t('auth.verify.resend.success.title'),
          description: t('auth.verify.resend.success.description'),
        });
      },
      onError: (error: any) => {
        toast({
          title: t('common.error'),
          description: error.message || t('auth.verify.resend.error'),
          variant: 'destructive',
        });
      }
    });
  };

  if (!email) {
    return null;
  }

  // Define the steps for the progress indicator
  const steps = [
    {
      id: 'info',
      title: t('auth.register.step1.title'),
      description: t('auth.register.step1.subtitle'),
    },
    {
      id: 'password',
      title: t('auth.register.step2.title'),
      description: t('auth.register.step2.subtitle'),
    },
    {
      id: 'verify',
      title: t('auth.register.step3.title'),
      description: t('auth.register.step3.subtitle'),
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      sessionStorage.removeItem('verificationData');
      goToLanding(language);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Sign Out Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {t('common.logout')}
      </Button>

      {/* Language and Theme Toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {t('auth.verify.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.verify.description')} {email}
            </CardDescription>
          </div>
          
          {/* Progress Steps */}
          <ProgressSteps 
            steps={steps}
            currentStep="verify"
            completedSteps={['info', 'password']}
          />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.verify.code')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.verify.codePlaceholder')}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={verifyEmail.isPending}>
                {verifyEmail.isPending && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('auth.verify.submit')}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {t('auth.verify.noCode')}{' '}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={handleResendCode}
              disabled={resendVerificationCode.isPending}
            >
              {resendVerificationCode.isPending && (
                <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
              )}
              {t('auth.verify.resendCode')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
