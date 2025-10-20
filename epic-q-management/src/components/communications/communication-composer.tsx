'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Send, Users, Mail, Bell, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useLoadingState } from '@/hooks/useLoadingState';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  hospital_name: string;
}

interface CommunicationComposerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CommunicationComposer({ onClose, onSuccess }: CommunicationComposerProps) {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<string[]>(['email', 'in_app']);
  const [showPreview, setShowPreview] = useState(false);
  
  const { isLoading, executeWithLoading } = useLoadingState();

  // Cargar coordinadores disponibles
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const response = await fetch('/api/admin/users?role=coordinator');
        if (response.ok) {
          const data = await response.json();
          setCoordinators(data.users || []);
        }
      } catch (error) {
        console.error('Error cargando coordinadores:', error);
        toast.error('Error cargando coordinadores');
      }
    };

    fetchCoordinators();
  }, [toast]);

  // Filtrar coordinadores por término de búsqueda
  const filteredCoordinators = coordinators.filter(coord =>
    coord.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coord.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coord.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChannelToggle = (channel: string) => {
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleCoordinatorToggle = (coordinatorId: string) => {
    setSelectedCoordinators(prev =>
      prev.includes(coordinatorId)
        ? prev.filter(id => id !== coordinatorId)
        : [...prev, coordinatorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCoordinators.length === filteredCoordinators.length) {
      setSelectedCoordinators([]);
    } else {
      setSelectedCoordinators(filteredCoordinators.map(c => c.id));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Asunto y mensaje son requeridos');
      return;
    }

    if (selectedCoordinators.length === 0) {
      toast.error('Selecciona al menos un coordinador');
      return;
    }

    if (channels.length === 0) {
      toast.error('Selecciona al menos un canal de comunicación');
      return;
    }

    await executeWithLoading(async () => {
      try {
        const response = await fetch('/api/communications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientIds: selectedCoordinators,
            subject: subject.trim(),
            body: body.trim(),
            channels
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message);
          onSuccess?.();
          onClose();
        } else {
          toast.error(data.error || 'Error enviando comunicación');
        }
      } catch (error) {
        console.error('Error enviando comunicación:', error);
        toast.error('Error enviando comunicación');
      }
    });
  };

  const selectedCoordinatorsData = coordinators.filter(c => selectedCoordinators.includes(c.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Nueva Comunicación</CardTitle>
            <CardDescription>
              Envía un mensaje a uno o más coordinadores
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Selección de Coordinadores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Destinatarios</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCoordinators.length === filteredCoordinators.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Buscar coordinadores por nombre, email o hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />

              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {filteredCoordinators.map((coord) => (
                  <div
                    key={coord.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleCoordinatorToggle(coord.id)}
                  >
                    <Checkbox
                      checked={selectedCoordinators.includes(coord.id)}
                      onChange={() => handleCoordinatorToggle(coord.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{coord.name}</p>
                      <p className="text-sm text-gray-500">{coord.email}</p>
                      <p className="text-xs text-gray-400">{coord.hospital_name}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCoordinators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCoordinatorsData.map((coord) => (
                    <Badge key={coord.id} variant="secondary" className="flex items-center gap-1">
                      {coord.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleCoordinatorToggle(coord.id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canales de Comunicación */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Canales de Comunicación</Label>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={channels.includes('email')}
                  onCheckedChange={() => handleChannelToggle('email')}
                />
                <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in_app"
                  checked={channels.includes('in_app')}
                  onCheckedChange={() => handleChannelToggle('in_app')}
                />
                <Label htmlFor="in_app" className="flex items-center space-x-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  <span>Notificación In-App</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="push"
                  checked={channels.includes('push')}
                  onCheckedChange={() => handleChannelToggle('push')}
                />
                <Label htmlFor="push" className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  <span>Push Notification</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Asunto */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-medium">Asunto</Label>
            <Input
              id="subject"
              placeholder="Ingresa el asunto del mensaje..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-base font-medium">Mensaje</Label>
            <Textarea
              id="body"
              placeholder="Escribe tu mensaje aquí..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[120px]"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Vista Previa</Label>
              <Card className="p-4 bg-gray-50">
                <div className="space-y-2">
                  <p className="font-medium text-sm text-gray-600">Para:</p>
                  <p className="text-sm">{selectedCoordinatorsData.map(c => c.name).join(', ')}</p>
                  
                  <p className="font-medium text-sm text-gray-600">Canales:</p>
                  <div className="flex space-x-2">
                    {channels.map(channel => (
                      <Badge key={channel} variant="outline">
                        {channel === 'email' && 'Email'}
                        {channel === 'in_app' && 'In-App'}
                        {channel === 'push' && 'Push'}
                      </Badge>
                    ))}
                  </div>

                  <p className="font-medium text-sm text-gray-600">Asunto:</p>
                  <p className="text-sm">{subject || 'Sin asunto'}</p>

                  <p className="font-medium text-sm text-gray-600">Mensaje:</p>
                  <p className="text-sm whitespace-pre-wrap">{body || 'Sin mensaje'}</p>
                </div>
              </Card>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || !subject.trim() || !body.trim() || selectedCoordinators.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Comunicación'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
