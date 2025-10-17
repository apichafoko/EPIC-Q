'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Communication, CommunicationFilters, communicationTypes } from '@/types';
import { mockCommunications, getHospitalById } from '@/lib/mock-data';

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<CommunicationFilters>({
    search: '',
    type: 'all',
    status: 'all'
  });

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
      default:
        return status;
    }
  };

  const filteredCommunications = useMemo(() => {
    let filtered = mockCommunications;

    // Filtrar por tipo
    if (activeTab !== 'all') {
      filtered = filtered.filter(comm => comm.type === activeTab);
    }

    // Aplicar filtros adicionales
    if (filters.search) {
      filtered = filtered.filter(comm => 
        comm.subject?.toLowerCase().includes(filters.search.toLowerCase()) ||
        comm.content.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(comm => comm.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(comm => comm.status === filters.status);
    }

    return filtered;
  }, [activeTab, filters]);

  const stats = useMemo(() => {
    const total = mockCommunications.length;
    const emails = mockCommunications.filter(c => c.type === 'email').length;
    const calls = mockCommunications.filter(c => c.type === 'call').length;
    const openRate = emails > 0 
      ? Math.round((mockCommunications.filter(c => c.status === 'opened').length / emails) * 100)
      : 0;

    return { total, emails, calls, openRate };
  }, []);

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Comunicación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-green-600">{stats.calls}</div>
            <div className="text-sm text-gray-600">Llamadas Realizadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.openRate}%</div>
            <div className="text-sm text-gray-600">Tasa de Apertura</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'all', label: 'Todas', count: mockCommunications.length },
          { id: 'email', label: 'Emails', count: mockCommunications.filter(c => c.type === 'email').length },
          { id: 'call', label: 'Llamadas', count: mockCommunications.filter(c => c.type === 'call').length },
          { id: 'note', label: 'Notas', count: mockCommunications.filter(c => c.type === 'note').length }
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
                {communicationTypes.map((type) => (
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
              <TableHead>Hospital</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Para</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommunications.map((comm) => {
              const hospital = getHospitalById(comm.hospital_id);
              return (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(comm.type)}
                      <span className="text-sm">{getTypeLabel(comm.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{hospital?.name || 'Hospital no encontrado'}</div>
                    <div className="text-xs text-gray-500">{hospital?.city}, {hospital?.province}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium truncate max-w-xs">
                      {comm.subject || `Comunicación ${getTypeLabel(comm.type)}`}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {comm.content.substring(0, 50)}...
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{comm.sent_by}</TableCell>
                  <TableCell className="text-sm">{comm.sent_to || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(comm.status)}>
                      {getStatusLabel(comm.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(comm.created_at).toLocaleDateString('es-AR')}
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
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
