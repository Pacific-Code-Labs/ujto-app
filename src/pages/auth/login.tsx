import { goToLanding } from "@/lib/links";
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
import { LanguageToggle } from "@/components/layout/toggles";
import { ThemeToggle } from "@/components/layout/toggles";
import { Home, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginForm) => {
    login.mutate(values, {
      onSuccess: (data) => {
        // Check if user needs verification
        if (data.needsVerification) {
          // Store verification data for the verify page
          sessionStorage.setItem('verificationData', JSON.stringify({
            email: values.email,
            password: values.password,
            timestamp: Date.now()
          }));
          
          toast({
            title: t('auth.verify.title'),
            description: t('auth.verify.description') + ' ' + values.email,
          });
          
          navigate(`/verify-email`);
          return;
        }

        toast({
          title: t('auth.login.success.title'),
          description: t('auth.login.success.description'),
        });

        // Back to where the visitor was going (AppLayout adds ?next=), else the overview.
        const next = new URLSearchParams(window.location.search).get("next");
        navigate(next && next.startsWith("/") && !next.startsWith("//") ? next : "/", { replace: true });
      },
      onError: (error: any) => {
        toast({
          title: t('common.error'),
          description: error.message || t('auth.login.error'),
          variant: 'destructive',
        });
      }
    });
  };

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
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.login.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.login.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('auth.login.emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.login.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('auth.login.passwordPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('auth.login.submit')}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => navigate(`/forgot-password`)}
              >
                {t('auth.login.forgotPassword')}?
              </Button>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('auth.login.noAccount')}{' '}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => navigate(`/register`)}
              >
                {t('auth.login.signUp')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
