'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MessageSquare, 
  Video, 
  FileText,
  Eye,
  Reply,
  Filter
} from 'lucide-react';
import { Communication, CommunicationFilters } from '../../../types';
import { getCommunications, getCommunicationTypes, getCommunicationStats } from '../../../lib/services/communication-service';
import { Skeleton } from '../../../components/ui/skeleton';
import CommunicationComposer from '../../../components/communications/communication-composer';
import { toast } from 'sonner';
import { useLoadingState } from '../../../hooks/useLoadingState';

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<CommunicationFilters>({
    search: '',
    type: 'all',
    status: 'all'
  });
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState({ total: 0, emails: 0, calls: 0, notes: 0, unread: 0 });
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showComposer, setShowComposer] = useState(false);

  const { isLoading, executeWithLoading } = useLoadingState();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Video className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Llamada';
      case 'meeting':
        return 'Reunión';
      case 'note':
        return 'Nota';
      case 'whatsapp':
        return 'WhatsApp';
      case 'manual':
        return 'Manual';
      case 'auto_alert':
        return 'Alerta Automática';
      case 'system':
        return 'Sistema';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'opened':
        return 'Abierto';
      case 'failed':
        return 'Fallido';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const [commsData, statsData] = await Promise.all([
        getCommunications(filters, currentPage, 25),
        getCommunicationStats()
      ]);

      setCommunications(commsData.communications);
      setTotalPages(commsData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error actualizando datos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [commsData, typesData, statsData] = await Promise.all([
          getCommunications(filters, currentPage, 25),
          getCommunicationTypes(),
          getCommunicationStats()
        ]);

        setCommunications(commsData.communications);
        setTotalPages(commsData.totalPages);
        setTypes(typesData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading communications data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, currentPage]);

  const filteredCommunications = communications.filter(comm => {
    if (activeTab !== 'all' && comm.type !== activeTab) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicaciones</h1>
          <p className="text-gray-600 mt-2">
            Gestión de comunicaciones con hospitales participantes
          </p>
        </div>
        <Button onClick={() => setShowComposer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Comunicación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Comunicaciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.emails}</div>
            <div className="text-sm text-gray-600">Emails Enviados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">No Leídas</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'all', label: 'Todas', count: stats.total },
          { id: 'email', label: 'Emails', count: stats.emails },
          { id: 'note', label: 'Notas', count: stats.notes }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar comunicaciones..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de comunicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(type)}
                      <span>{getTypeLabel(type)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="opened">Abierto</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setFilters({ search: '', type: 'all', status: 'all' })}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Comunicaciones */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                </TableRow>
              ))
            ) : filteredCommunications.length > 0 ? (
              filteredCommunications.map((comm) => (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(comm.type || 'general')}
                      <span className="text-sm">{getTypeLabel(comm.type || 'general')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{comm.project_name || comm.hospital_name || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium truncate max-w-xs">
                      {comm.subject || `Comunicación ${getTypeLabel(comm.type || 'general')}`}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {comm.content?.substring(0, 50) || 'Sin contenido'}...
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{comm.user_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(comm.status || 'sent')}>
                      {getStatusLabel(comm.status || 'sent')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(comm.sent_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {comm.type === 'email' && (
                        <Button size="sm" variant="outline">
                          <Reply className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay comunicaciones disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Composer Modal */}
      {showComposer && (
        <CommunicationComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
