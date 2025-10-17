'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Mail,
  FileText,
  Users,
  Settings,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { EmailTemplate, templateCategories } from '@/types';
import { mockEmailTemplates } from '@/lib/mock-data';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recruitment':
        return <Users className="h-4 w-4" />;
      case 'followup':
        return <Mail className="h-4 w-4" />;
      case 'technical':
        return <Settings className="h-4 w-4" />;
      case 'operations':
        return <BarChart3 className="h-4 w-4" />;
      case 'quality':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'recruitment':
        return 'Reclutamiento';
      case 'followup':
        return 'Seguimiento';
      case 'technical':
        return 'Técnico';
      case 'operations':
        return 'Operaciones';
      case 'quality':
        return 'Calidad';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'recruitment':
        return 'bg-blue-100 text-blue-800';
      case 'followup':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'operations':
        return 'bg-orange-100 text-orange-800';
      case 'quality':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, is_active: !template.is_active }
        : template
    ));
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      name: `${template.name} (Copia)`,
      usage_count: 0
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Email</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los templates de email para comunicaciones automáticas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {templates.reduce((sum, t) => sum + t.usage_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Usos Totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(templates.reduce((sum, t) => sum + t.usage_count, 0) / templates.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Promedio de Usos</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {templateCategories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => toggleTemplateStatus(template.id)}
                  />
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryLabel(template.category)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asunto */}
              <div>
                <label className="text-sm font-medium text-gray-600">Asunto</label>
                <p className="text-sm text-gray-900 mt-1">{template.subject}</p>
              </div>

              {/* Vista previa del cuerpo */}
              <div>
                <label className="text-sm font-medium text-gray-600">Vista Previa</label>
                <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                  {template.body}
                </p>
              </div>

              {/* Variables disponibles */}
              <div>
                <label className="text-sm font-medium text-gray-600">Variables</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{template.usage_count} usos</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  template.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => duplicateTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template por defecto */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Templates Predefinidos</h3>
              <p className="text-sm text-blue-700 mt-1">
                El sistema incluye 6 templates predefinidos para las comunicaciones más comunes:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Invitación inicial a participar</li>
                <li>• Recordatorio aprobación ética</li>
                <li>• Confirmación alta en RedCap</li>
                <li>• Recordatorio período de reclutamiento próximo</li>
                <li>• Seguimiento baja completitud de casos</li>
                <li>• Reporte mensual de avances</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
