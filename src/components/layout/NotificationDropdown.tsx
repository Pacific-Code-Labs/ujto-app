import { ListSkeleton } from "@pacific-code-labs/ujto-ds";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from "@pacific-code-labs/ujto-ds";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@pacific-code-labs/ujto-ds";
import { Badge } from "@pacific-code-labs/ujto-ds";
import { useLanguage } from "@pacific-code-labs/ujto-ds";
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { isRealtimeConnected } from '@/services/realtime.service';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  queryKeys,
} from '@/lib/api';

/** Where a notification leads (its related id is a transcription or a support ticket). */
function notificationHref(notification: { type: string; relatedId?: string | null }) {
  if (!notification.relatedId) return null;
  if (notification.type === 'support_reply') return `/support/${notification.relatedId}`;
  if (notification.type.startsWith('transcription_')) return `/transcriptions/${notification.relatedId}`;
  return null;
}

export function NotificationDropdown() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notificationData, isLoading } = useQuery({
    queryKey: queryKeys.notifications(user?.id),
    queryFn: () => listNotifications(user!.id),
    enabled: !!user?.id,
    // Realtime hints refetch the bell; polling is only the fallback when the socket is down.
    refetchInterval: () => (isRealtimeConnected() ? 300_000 : 30_000),
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await markNotificationRead(user!.id, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user?.id) });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await markAllNotificationsRead(user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user?.id) });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return t('notifications.timeAgo.justNow');
    } else if (diffInMinutes < 60) {
      return t('notifications.timeAgo.minutesAgo').replace('{minutes}', diffInMinutes.toString());
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('notifications.timeAgo.hoursAgo').replace('{hours}', hours.toString());
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t('notifications.timeAgo.daysAgo').replace('{days}', days.toString());
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transcription_completed':
        return '✅';
      case 'transcription_failed':
        return '❌';
      case 'support_reply':
        return '💬';
      case 'system':
      default:
        return '🔔';
    }
  };

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const displayTitle = (notification: { type: string; title: string }) => {
    if (notification.type === 'transcription_completed') return t('notifications.transcriptionCompleted');
    if (notification.type === 'transcription_failed') return t('notifications.transcriptionFailed');
    if (notification.type === 'system' && /^(🎉\s*)?(Welcome to|¡Bienvenido a) Ujtö̀/i.test(notification.title)) {
      return t('notifications.welcomeTitle');
    }
    return notification.title;
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs h-8"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Grows with the list; scrolls only past 360 px (a fixed height left empty space). */}
        <div className="max-h-[360px] overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="p-3">
              <ListSkeleton rows={3} rowClassName="border-0 p-2" label={t('common.loading')} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-2xl mb-2">🔕</div>
              <div className="text-sm font-medium text-muted-foreground">
                {t('notifications.empty')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('notifications.emptyDescription')}
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer focus:bg-muted ${
                  !notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
                onSelect={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                  const href = notificationHref(notification);
                  if (href) navigate(href);
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-lg mt-1 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium truncate">
                        {displayTitle(notification)}
                      </h4>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatTimeAgo(new Date(notification.createdAt || new Date()))}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
