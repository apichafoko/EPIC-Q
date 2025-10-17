'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter,
  Reply,
  Archive,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function CoordinatorCommunicationsPage() {
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for communications
  const communications = [
    {
      id: '1',
      type: 'email',
      title: 'Nueva comunicación del comité investigador',
      message: 'Se ha enviado una actualización importante sobre el protocolo del estudio. Por favor, revisa los cambios en la sección de documentos.',
      sender: 'Comité Investigador EPIC-Q',
      date: '2024-01-15T10:30:00Z',
      read: false,
      priority: 'high',
      category: 'protocol'
    },
    {
      id: '2',
      type: 'call',
      title: 'Llamada de seguimiento programada',
      message: 'Se ha programado una llamada de seguimiento para el próximo martes a las 14:00 hs. Por favor, confirma tu disponibilidad.',
      sender: 'Dr. María González',
      date: '2024-01-14T16:45:00Z',
      read: true,
      priority: 'medium',
      category: 'follow-up'
    },
    {
      id: '3',
      type: 'note',
      title: 'Recordatorio: Subir documento de ética',
      message: 'Recuerda subir el documento de aprobación del comité de ética antes del 20 de enero.',
      sender: 'Sistema EPIC-Q',
      date: '2024-01-13T09:15:00Z',
      read: true,
      priority: 'high',
      category: 'reminder'
    },
    {
      id: '4',
      type: 'email',
      title: 'Invitación a webinar de capacitación',
      message: 'Te invitamos a participar del webinar de capacitación sobre el uso de RedCap el próximo viernes a las 11:00 hs.',
      sender: 'Equipo de Capacitación',
      date: '2024-01-12T14:20:00Z',
      read: false,
      priority: 'low',
      category: 'training'
    },
    {
      id: '5',
      type: 'note',
      title: 'Confirmación de período de reclutamiento',
      message: 'Se ha confirmado el período de reclutamiento del 1 al 15 de febrero. Puedes comenzar a registrar casos en RedCap.',
      sender: 'Sistema EPIC-Q',
      date: '2024-01-11T11:00:00Z',
      read: true,
      priority: 'medium',
      category: 'confirmation'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'protocol':
        return <Badge variant="outline">Protocolo</Badge>;
      case 'follow-up':
        return <Badge variant="outline">Seguimiento</Badge>;
      case 'reminder':
        return <Badge variant="outline">Recordatorio</Badge>;
      case 'training':
        return <Badge variant="outline">Capacitación</Badge>;
      case 'confirmation':
        return <Badge variant="outline">Confirmación</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.sender.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && comm.read) ||
                         (filterStatus === 'unread' && !comm.read);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = communications.filter(comm => !comm.read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.communications')}</h1>
        <p className="text-gray-600 mt-2">
          Gestiona las comunicaciones del comité investigador
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{communications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">No Leídas</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Leídas</p>
                <p className="text-2xl font-bold">{communications.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Esta Semana</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar comunicaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Llamada</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">No leídas</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({communications.length})</TabsTrigger>
          <TabsTrigger value="unread">No leídas ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Leídas ({communications.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredCommunications.map((comm) => (
            <Card key={comm.id} className={`${!comm.read ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(comm.type)}
                      <h3 className={`font-medium ${!comm.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {comm.title}
                      </h3>
                      {!comm.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {comm.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>De: {comm.sender}</span>
                      <span>•</span>
                      <span>{new Date(comm.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getPriorityBadge(comm.priority)}
                    {getCategoryBadge(comm.category)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Marcar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {filteredCommunications.filter(comm => !comm.read).map((comm) => (
            <Card key={comm.id} className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(comm.type)}
                      <h3 className="font-medium text-blue-900">
                        {comm.title}
                      </h3>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {comm.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>De: {comm.sender}</span>
                      <span>•</span>
                      <span>{new Date(comm.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getPriorityBadge(comm.priority)}
                    {getCategoryBadge(comm.category)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Marcar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {filteredCommunications.filter(comm => comm.read).map((comm) => (
            <Card key={comm.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(comm.type)}
                      <h3 className="font-medium text-gray-900">
                        {comm.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {comm.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>De: {comm.sender}</span>
                      <span>•</span>
                      <span>{new Date(comm.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getPriorityBadge(comm.priority)}
                    {getCategoryBadge(comm.category)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Marcar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
