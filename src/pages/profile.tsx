import { FormSkeleton } from "@pacific-code-labs/ujto-ds";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@pacific-code-labs/ujto-ds";
import { useLanguage } from "@pacific-code-labs/ujto-ds";
import { queryKeys, updateProfile } from '@/lib/api';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Drawer } from "@pacific-code-labs/ujto-ds";
import { Badge } from "@pacific-code-labs/ujto-ds";
import { Loader2, User, Mail, Crown, Calendar, Pencil } from 'lucide-react';
import { PageHeader } from "@pacific-code-labs/ujto-ds";

const profileSchema = z.object({
  username: z.string().min(3, 'validation.usernameMin').max(20, 'validation.usernameMax'),
  firstName: z.string().min(1, 'validation.firstNameRequired'),
  lastName: z.string().min(1, 'validation.lastNameRequired'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return updateProfile(user!.id, data);
    },
    onSuccess: async (updatedUser) => {
      toast({
        title: t('profile.update.success.title'),
        description: t('profile.update.success.description'),
      });
      
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      setEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('profile.update.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    await updateProfileMutation.mutateAsync(values);
  };

  // Update form when user data loads
  useEffect(() => {
    if (user && !updateProfileMutation.isPending) {
      form.reset({
        username: user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, form, updateProfileMutation.isPending]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <FormSkeleton fields={5} label={t("common.loading")} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {t("profile.loginRequired")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      <div className="space-y-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.title')}
              </CardTitle>
              <CardDescription>
                {t('profile.description')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('profile.edit.title')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.email}</span>
                {user.isEmailVerified && (
                  <Badge variant="secondary" className="text-xs">
                    {t('profile.verified')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">
                  {user.subscriptionTier} {t('profile.plan')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('profile.memberSince')} {new Date(user.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.transcriptionsUsed || 0} {t('profile.transcriptionsUsed')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Editing lives in a drawer: the profile page stays a clean summary. */}
      <Drawer
        open={editing}
        onOpenChange={setEditing}
        title={t('profile.edit.title')}
        description={t('profile.edit.description')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="profile-form" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('profile.edit.submit')}
            </Button>
          </>
        }
      >
            <Form {...form}>
              <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.edit.username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('profile.edit.usernamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.edit.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('profile.edit.firstNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.edit.lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('profile.edit.lastNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>
                      {t('profile.edit.emailNote')}: {user.email}
                    </span>
                  </div>
                </div>
              </form>
            </Form>
      </Drawer>
    </div>
  );
}