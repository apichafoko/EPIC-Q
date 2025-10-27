'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../../../hooks/useTranslations';
import { useConfirmation } from '../../../../hooks/useConfirmation';
import { toast } from 'sonner';
import { AuthGuard } from '../../../../components/auth/auth-guard';
import { ConfirmationToast } from '../../../../components/ui/confirmation-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Eye,
  Mail,
  FileText
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, any>;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const { t } = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { confirm, isConfirming, confirmationData, handleConfirm, handleCancel } = useConfirmation();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/es/auth/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/es/coordinator');
      return;
    }

    loadTemplates();
  }, [user, authLoading, router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-templates');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Error al cargar los templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
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
          const response = await fetch(`/api/admin/email-templates/${templateId}`, {
            method: 'DELETE',
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
    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.is_active) ||
                         (statusFilter === 'inactive' && !template.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      invitation: 'bg-blue-100 text-blue-800',
      password_reset: 'bg-red-100 text-red-800',
      notification: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || colors.general}>
        {category}
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
            <h1 className="text-3xl font-bold text-gray-900">Templates de Email</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los templates de email del sistema
            </p>
          </div>
          <Button onClick={() => setShowEditModal(true)}>
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
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.category === 'invitation').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((sum, t) => sum + t.usage_count, 0)}
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
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="invitation">Invitaciones</SelectItem>
                  <SelectItem value="password_reset">Restablecer contraseña</SelectItem>
                  <SelectItem value="notification">Notificaciones</SelectItem>
                  <SelectItem value="general">General</SelectItem>
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
            <CardTitle>Templates de Email</CardTitle>
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
                    <TableHead>Asunto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Última actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={template.subject}>
                          {template.subject}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
