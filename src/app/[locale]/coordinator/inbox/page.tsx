'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '../../../../hooks/useTranslations';
import { useAuth } from '../../../../contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Mail, Bell, AlertTriangle, Info, CheckCircle, Search } from 'lucide-react';

interface UnifiedItem {
  id: string;
  source: 'communication' | 'system' | 'alert';
  title: string;
  message: string;
  created_at: string; // ISO
  read: boolean;
}

export default function CoordinatorInboxPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [itemsAll, setItemsAll] = useState<UnifiedItem[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'communications' | 'system' | 'alerts'>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'communication' | 'system' | 'alert'>('all');

  const unreadCount = useMemo(() => itemsAll.filter(i => !i.read && (i.source === 'system' || i.source === 'communication')).length, [itemsAll]);

  const formatTimeAgo = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60)); // minutes
    if (diff < 60) return `Hace ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  const iconFor = (source: UnifiedItem['source']) => {
    switch (source) {
      case 'communication': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'system': return <Info className="h-4 w-4 text-indigo-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [notifRes, commRes] = await Promise.all([
          fetch('/api/notifications?limit=50', { credentials: 'include' }),
          fetch(`/api/communications?userId=${encodeURIComponent(user.id)}&page=1&limit=100`, { credentials: 'include' })
        ]);
        const notifData = notifRes.ok ? await notifRes.json() : { notifications: [] };
        const commData = commRes.ok ? await commRes.json() : { communications: [] };

        const unified: UnifiedItem[] = (notifData.notifications || []).map((n: any) => ({
          id: n.id,
          source: n.source || 'system',
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          read: !!n.read,
        }));
        setItemsAll(unified);
        setCommunications(commData.communications || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const filteredAll = useMemo(() => {
    const term = search.toLowerCase();
    return itemsAll.filter(i => {
      if (typeFilter !== 'all' && i.source !== typeFilter) return false;
      if (!term) return true;
      return (i.title || '').toLowerCase().includes(term) || (i.message || '').toLowerCase().includes(term);
    });
  }, [itemsAll, search, typeFilter]);

  const markAsRead = async (item: UnifiedItem) => {
    try {
      if (item.source === 'alert') return; // no aplica
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId: item.id, type: item.source === 'communication' ? 'communication' : 'notification' })
      });
    } catch {}
    // Optimistic update
    setItemsAll(prev => prev.map(p => p.id === item.id ? { ...p, read: true } : p));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications:update'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bandeja
        </h1>
        <p className="text-gray-600 mt-2">Comunicaciones, notificaciones y alertas</p>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="mt-2">{unreadCount} no leídas</Badge>
        )}
      </div>

      <div className="flex items-center gap-3 flex-col sm:flex-row">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-10" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="communication">Comunicaciones</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
            <SelectItem value="alert">Alertas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({filteredAll.length})</TabsTrigger>
          <TabsTrigger value="communications">Comunicaciones ({communications.length})</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredAll.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-gray-500">Sin elementos</CardContent></Card>
          ) : filteredAll.map(item => (
            <Card key={`${item.source}-${item.id}`} className={!item.read ? 'border-blue-200 bg-blue-50' : ''}>
              <CardContent className="p-4 flex items-start gap-3">
                {iconFor(item.source)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!item.read ? 'text-blue-900' : 'text-gray-900'}`}>{item.title}</span>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{item.message}</p>
                  <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(item.created_at)}</div>
                </div>
                {(!item.read && item.source !== 'alert') && (
                  <Button size="sm" variant="outline" onClick={() => markAsRead(item)}>Marcar leída</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="communications" className="space-y-3">
          {communications.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-gray-500">Sin comunicaciones</CardContent></Card>
          ) : communications.map((c: any) => (
            <Card key={c.id} className={!c.read_at ? 'border-blue-200 bg-blue-50' : ''}>
              <CardContent className="p-4 flex items-start gap-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!c.read_at ? 'text-blue-900' : 'text-gray-900'}`}>{c.subject || 'Comunicación'}</span>
                    {!c.read_at && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.body}</p>
                  <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(c.sent_at)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="system" className="space-y-3">
          {filteredAll.filter(i => i.source === 'system').map(i => (
            <Card key={`sys-${i.id}`} className={!i.read ? 'border-blue-200 bg-blue-50' : ''}>
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!i.read ? 'text-blue-900' : 'text-gray-900'}`}>{i.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{i.message}</p>
                  <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(i.created_at)}</div>
                </div>
                {!i.read && <Button size="sm" variant="outline" onClick={() => markAsRead(i)}>Marcar leída</Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          {filteredAll.filter(i => i.source === 'alert').map(i => (
            <Card key={`al-${i.id}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{i.title}</span>
                    <Badge variant="outline">Alerta</Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{i.message}</p>
                  <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(i.created_at)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
