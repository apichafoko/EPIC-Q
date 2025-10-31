'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { useTranslations } from '../../hooks/useTranslations';
// Removed direct import to avoid client-side module issues

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  source?: string;
  data?: any;
}

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { t } = useTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [grouped, setGrouped] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useGrouped, setUseGrouped] = useState(true);

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?limit=10${useGrouped ? '&group=true' : ''}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.grouped) {
          setGrouped(data.notifications || []);
        } else {
          setNotifications(data.notifications || []);
        }
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string, notificationType: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificationId,
          type: notificationType
        }),
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getTypeColor = (type: string, source?: string) => {
    if (source === 'alert') {
      switch (type) {
        case 'critical': return 'text-red-600';
        case 'high': return 'text-orange-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    }
    
    switch (type) {
      case 'communication': return 'text-blue-600';
      case 'alert': return 'text-orange-600';
      case 'notification': return 'text-purple-600';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string, source?: string) => {
    if (source === 'alert') {
      switch (type) {
        case 'critical': return '🚨';
        case 'high': return '⚠️';
        case 'medium': return '⏰';
        case 'low': return 'ℹ️';
        default: return '🔔';
      }
    }
    
    switch (type) {
      case 'communication': return '📧';
      case 'alert': return '⚠️';
      case 'notification': return '🔔';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-80 z-50">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between text-foreground">
                <CardTitle className="text-lg">{t('common.notifications')}</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    {t('common.markAllAsRead')}
                  </Button>
                )}
              </div>
              <CardDescription className="mt-1 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>{useGrouped ? t('common.grouped') || 'Agrupadas' : t('common.all') || 'Todas'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => {
                      setUseGrouped(v => !v);
                      // recargar con el nuevo modo
                      setTimeout(loadNotifications, 0);
                    }}
                  >
                    {useGrouped ? (t('common.viewAll') || 'Ver todas') : (t('common.viewGrouped') || 'Ver agrupadas')}
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('common.loading')}...
                  </div>
                ) : (useGrouped ? grouped.length === 0 : notifications.length === 0) ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('common.noNotifications')}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {useGrouped
                      ? grouped.map((group: any) => (
                          <div key={group.key} className="p-3 hover:bg-accent cursor-pointer border-l-4 border-l-transparent">
                            <div className="flex items-start space-x-2">
                              <span className="text-lg">
                                {getTypeIcon(group.type, group.source)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${getTypeColor(group.type, group.source)}`}>
                                    {group.title}
                                  </p>
                                  <Badge variant={group.unreadCount > 0 ? 'default' : 'secondary'} className="text-xs">
                                    {group.unreadCount > 0 ? `${group.unreadCount} nuevas` : `${group.count}`}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {group.sampleMessage}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(group.latest_at).toLocaleString()}
                                  {group.data?.hospital_name ? ` • ${group.data.hospital_name}` : ''}
                                  {group.data?.project_name ? ` • ${group.data.project_name}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      : notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-accent cursor-pointer border-l-4 ${
                              notification.read ? 'border-l-transparent' : 'border-l-blue-500'
                            }`}
                            onClick={() => !notification.read && markAsRead(notification.id, notification.type)}
                          >
                            <div className="flex items-start space-x-2">
                              <span className="text-lg">
                                {getTypeIcon(notification.type, notification.source)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${getTypeColor(notification.type, notification.source)}`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id, notification.type);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
