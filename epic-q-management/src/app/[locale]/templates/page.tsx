'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { useConfirmation } from '@/hooks/useConfirmation';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EmailTemplateService } from '@/lib/notifications/email-template-service';
import { ConfirmationToast } from '@/components/ui/confirmation-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Eye,
  Mail,
  FileText,
  Smartphone,
  Monitor,
  X,
  Save
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'email' | 'both';
  internal_subject?: string;
  internal_body?: string;
  email_subject?: string;
  email_body?: string;
  variables: Record<string, any>;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const { t } = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { confirm, isConfirming, confirmationData, handleConfirm, handleCancel } = useConfirmation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'internal' as 'internal' | 'email' | 'both',
    internal_subject: '',
    internal_body: '',
    email_subject: '',
    email_body: '',
    category: 'general',
    is_active: true
  });

  // Función para procesar variables del template
  const processTemplateVariables = (template: Template) => {
    // Obtener URL del logo de entorno para previsualización (fallback a base64 embebido)
    const getEmailLogoUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL;
      if (envUrl && envUrl.trim()) return envUrl.trim();
      // Fallback: usar el asset público relativo
      return '/logo-email.svg';
    };

    const sampleVariables = {
      userName: 'Dr. Juan Pérez',
      userEmail: 'juan.perez@hospital.com',
      hospitalName: 'Hospital de Prueba',
      projectName: 'Proyecto EPIC-Q 2024',
      systemName: 'EPIC-Q Management System',
      invitationLink: 'http://localhost:3000/es/auth/login',
      resetLink: 'http://localhost:3000/es/auth/reset-password',
      temporaryPassword: 'TempPass123!',
      requiredPeriods: 2,
      projectDescription: 'Estudio Perioperatorio Integral de Cuidados Quirúrgicos',
      meetingDate: '15 de Enero, 2024',
      meetingTime: '10:00 AM',
      meetingType: 'Virtual',
      meetingDuration: '1 hora',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      caseId: 'CASE-001',
      newStatus: 'En Progreso',
      changeDate: '10 de Enero, 2024',
      additionalInfo: 'El caso ha sido actualizado con nueva información.',
      systemUrl: 'http://localhost:3000/es/dashboard',
      logoUrl: getEmailLogoUrl()
    };

    // Procesar subject
    let processedSubject = template.email_subject || template.internal_subject || '';
    Object.keys(sampleVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = sampleVariables[key as keyof typeof sampleVariables] || '';
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Procesar body
    let processedBody = template.email_body || template.internal_body || '';
    Object.keys(sampleVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = sampleVariables[key as keyof typeof sampleVariables] || '';
      processedBody = processedBody.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return {
      subject: processedSubject,
      body: processedBody
    };
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      console.log('No user, redirecting to login');
      router.push('/es/auth/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('User is not admin, redirecting to coordinator');
      router.push('/es/coordinator');
      return;
    }

    console.log('User is admin, loading templates');
    loadTemplates();
  }, [user, authLoading, router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('Loading templates...');
      const response = await fetch('/api/templates', {
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Templates data:', data);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Error al cargar los templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      internal_subject: template.internal_subject || '',
      internal_body: template.internal_body || '',
      email_subject: template.email_subject || '',
      email_body: template.email_body || '',
      category: template.category || 'general',
      is_active: template.is_active
    });
    setShowEditModal(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'internal',
      internal_subject: '',
      internal_body: '',
      email_subject: '',
      email_body: '',
      category: 'general',
      is_active: true
    });
    setShowEditModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);

      // Validaciones básicas
      if (!formData.name.trim()) {
        toast.error('El nombre es requerido');
        return;
      }

      if (formData.type === 'internal' && !formData.internal_body.trim()) {
        toast.error('El cuerpo interno es requerido para templates internos');
        return;
      }

      if (formData.type === 'email' && !formData.email_body.trim()) {
        toast.error('El cuerpo de email es requerido para templates de email');
        return;
      }

      if (formData.type === 'both' && (!formData.internal_body.trim() || !formData.email_body.trim())) {
        toast.error('Ambos cuerpos son requeridos para templates mixtos');
        return;
      }

      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      // Enviar todos los datos del formulario
      const requestData = formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success(editingTemplate ? 'Template actualizado exitosamente' : 'Template creado exitosamente');
        setShowEditModal(false);
        loadTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar el template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    confirm(
      {
        title: 'Eliminar Template',
        description: `¿Estás seguro de que quieres eliminar el template "${template.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        try {
          const response = await fetch(`/api/templates/${templateId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            toast.success('Template eliminado exitosamente');
            loadTemplates();
          } else {
            const data = await response.json();
            toast.error(data.error || 'Error al eliminar el template');
          }
        } catch (error) {
          console.error('Failed to delete template:', error);
          toast.error('Error de conexión');
        }
      }
    );
  };

  const handleToggleStatus = async (templateId: string, currentStatus: boolean) => {
    if (!templateId) {
      toast.error('Error: ID del template no válido');
      return;
    }
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Template ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
        loadTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al actualizar el template');
      }
    } catch (error) {
      console.error('Failed to toggle template status:', error);
      toast.error('Error de conexión');
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.is_active) ||
                         (statusFilter === 'inactive' && !template.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const colors = {
      internal: 'bg-blue-100 text-blue-800',
      email: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800'
    };
    
    const icons = {
      internal: <Smartphone className="h-3 w-3 mr-1" />,
      email: <Mail className="h-3 w-3 mr-1" />,
      both: <Monitor className="h-3 w-3 mr-1" />
    };
    
    const labels = {
      internal: 'Interna',
      email: 'Email',
      both: 'Ambas'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.internal}>
        {icons[type as keyof typeof icons]}
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge> :
      <Badge variant="secondary">Inactivo</Badge>;
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates de Comunicación</h1>
            <p className="text-gray-600 mt-2">
              Gestiona templates para comunicaciones internas y emails
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internos</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.type === 'internal' || t.type === 'both').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.type === 'email' || t.type === 'both').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="internal">Comunicación Interna</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Ambas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Templates de Comunicación</CardTitle>
            <CardDescription>
              {filteredTemplates.length} de {templates.length} templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando templates...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Última actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    if (!template.id) {
                      console.error('Template without ID:', template);
                      return null;
                    }
                    return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={template.description}>
                          {template.description}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(template.type)}</TableCell>
                      <TableCell>{getStatusBadge(template.is_active)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{template.usage_count}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(template.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Previsualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(template.id, template.is_active)}
                            >
                              {template.is_active ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edición/Creación */}
        {showEditModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingTemplate ? 'Editar Template' : 'Crear Template'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre del template"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="general"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del template"
                    rows={2}
                  />
                </div>

                {/* Tipo de template */}
                <div className="space-y-3">
                  <Label>Tipo de Template *</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as 'internal' | 'email' | 'both' })}
                    className="flex space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="internal" id="internal" />
                      <Label htmlFor="internal" className="flex items-center">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Comunicación Interna
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        Ambas
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Contenido interno */}
                {(formData.type === 'internal' || formData.type === 'both') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                      Comunicación Interna
                    </h3>
                    <div>
                      <Label htmlFor="internal_subject">Asunto Interno</Label>
                      <Input
                        id="internal_subject"
                        value={formData.internal_subject}
                        onChange={(e) => setFormData({ ...formData, internal_subject: e.target.value })}
                        placeholder="Asunto para notificaciones internas"
                      />
                    </div>
                    <div>
                      <Label htmlFor="internal_body">Cuerpo Interno *</Label>
                      <Textarea
                        id="internal_body"
                        value={formData.internal_body}
                        onChange={(e) => setFormData({ ...formData, internal_body: e.target.value })}
                        placeholder="Contenido del mensaje interno"
                        rows={6}
                      />
                    </div>
                  </div>
                )}

                {/* Contenido de email */}
                {(formData.type === 'email' || formData.type === 'both') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-green-600" />
                      Email
                    </h3>
                    <div>
                      <Label htmlFor="email_subject">Asunto de Email</Label>
                      <Input
                        id="email_subject"
                        value={formData.email_subject}
                        onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                        placeholder="Asunto del email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email_body">Cuerpo de Email *</Label>
                      <Textarea
                        id="email_body"
                        value={formData.email_body}
                        onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                        placeholder="Contenido del email (HTML permitido)"
                        rows={8}
                      />
                    </div>
                  </div>
                )}

                {/* Estado */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Template activo</Label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingTemplate ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Previsualización */}
        {showPreviewModal && previewTemplate && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Previsualización del Template</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Información del template */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                      <p className="text-sm">{previewTemplate.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <div className="mt-1">
                        {getTypeBadge(previewTemplate.type)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estado</Label>
                      <div className="mt-1">
                        {getStatusBadge(previewTemplate.is_active)}
                      </div>
                    </div>
                  </div>
                  {previewTemplate.description && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                      <p className="text-sm mt-1">{previewTemplate.description}</p>
                    </div>
                  )}
                </div>

                {/* Previsualización interna */}
                {(previewTemplate.type === 'internal' || previewTemplate.type === 'both') && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                      Comunicación Interna
                    </h3>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      {(() => {
                        const processed = processTemplateVariables(previewTemplate);
                        return (
                          <>
                            {processed.subject && (
                              <div className="mb-3">
                                <Label className="text-sm font-medium text-gray-600">Asunto:</Label>
                                <p className="text-sm font-medium">{processed.subject}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Contenido:</Label>
                              <div className="mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                                {processed.body}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Previsualización de email */}
                {(previewTemplate.type === 'email' || previewTemplate.type === 'both') && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      <Mail className="h-5 w-5 mr-2 text-green-600" />
                      Email
                    </h3>
                    <div className="border rounded-lg p-4 bg-green-50">
                      {(() => {
                        const processed = processTemplateVariables(previewTemplate);
                        return (
                          <>
                            {processed.subject && (
                              <div className="mb-3">
                                <Label className="text-sm font-medium text-gray-600">Asunto:</Label>
                                <p className="text-sm font-medium">{processed.subject}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Contenido:</Label>
                              <div 
                                className="mt-1 p-3 bg-white rounded border text-sm"
                                dangerouslySetInnerHTML={{ __html: processed.body }}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de cerrar */}
              <div className="flex justify-end mt-6 pt-4 border-t">
                <Button onClick={() => setShowPreviewModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Toast */}
        {confirmationData && (
          <ConfirmationToast
            isOpen={true}
            options={confirmationData.options}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isLoading={isConfirming}
          />
        )}
      </div>
    </AuthGuard>
  );
}
