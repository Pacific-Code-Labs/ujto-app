import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@pacific-code-labs/ujto-ds";
import { Input } from "@pacific-code-labs/ujto-ds";
import { Label } from "@pacific-code-labs/ujto-ds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pacific-code-labs/ujto-ds";
import { useToast } from "@pacific-code-labs/ujto-ds";
import { resetPassword } from "aws-amplify/auth";
import { useLanguage } from "@pacific-code-labs/ujto-ds";

const forgotPasswordSchema = z.object({
  email: z.string().email("validation.emailInvalid"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      // Cognito emails a 6-digit reset code
      return resetPassword({ username: data.email });
    },
    onSuccess: (_result, data) => {
      setIsSubmitted(true);
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
      toast({
        title: t("auth.forgot.success.title"),
        description: t("auth.forgot.success.description"),
      });
    },
    onError: (error: any) => {
      console.error("Forgot password error:", error);
      toast({
        title: t("messages.error"),
        description: error.message || t("auth.forgot.error"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    console.log("Forgot password form submitted:", data.email);
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t("auth.forgot.success.title")}</CardTitle>
            <CardDescription>
              {t("auth.forgot.success.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  {t("auth.forgot.backToLogin")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("auth.forgot.title")}</CardTitle>
          <CardDescription>
            {t("auth.forgot.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.forgot.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.forgot.emailPlaceholder")}
                {...form.register("email")}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {t(String(form.formState.errors.email.message ?? ""))}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? t("auth.forgot.sending") + "..." : t("auth.forgot.submit")}
            </Button>

            <div className="text-center">
              <Link href="/login">
                <Button variant="link" className="p-0">
                  {t("auth.forgot.backToLogin")}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}