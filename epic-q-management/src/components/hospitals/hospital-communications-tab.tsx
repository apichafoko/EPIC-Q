'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, 
  Mail, 
  Phone, 
  MessageSquare, 
  Video, 
  FileText,
  Search,
  Filter,
  Eye,
  Reply
} from 'lucide-react';
import { Communication, communicationTypes } from '../../types';

interface HospitalCommunicationsTabProps {
  communications: Communication[];
  hospitalName: string;
}

export function HospitalCommunicationsTab({ communications, hospitalName }: HospitalCommunicationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = !searchTerm || 
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedCommunications = filteredCommunications.sort((a, b) => 
    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comunicaciones</h2>
          <p className="text-gray-600 mt-1">
            Historial de comunicaciones con {hospitalName}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Comunicación
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar en comunicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="opened">Abierto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{communications.length}</div>
            <div className="text-sm text-gray-600">Total Comunicaciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {communications.filter(c => c.type === 'email').length}
            </div>
            <div className="text-sm text-gray-600">Emails</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {communications.filter(c => c.type === 'call').length}
            </div>
            <div className="text-sm text-gray-600">Llamadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((communications.filter(c => c.status === 'opened').length / 
                communications.filter(c => c.type === 'email').length) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Tasa de Apertura</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comunicaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Comunicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCommunications.length > 0 ? (
            <div className="space-y-4">
              {sortedCommunications.map((comm) => (
                <div key={comm.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(comm.type || 'general')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {comm.subject || `Comunicación ${getTypeLabel(comm.type || 'general')}`}
                          </h4>
                          <Badge className={getStatusColor(comm.status || 'sent')}>
                            {getStatusLabel(comm.status || 'sent')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {comm.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Enviado por: {comm.user_name}</span>
                          {comm.hospital_name && (
                            <span>Para: {comm.hospital_name}</span>
                          )}
                          <span>
                            {new Date(comm.sent_at).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {comm.type === 'email' && (
                        <Button size="sm" variant="outline">
                          <Reply className="h-4 w-4 mr-1" />
                          Reenviar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay comunicaciones registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
