'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '../../components/ui/modal';
import { FileText, Video, Link as LinkIcon, Upload, Trash2, Edit, Youtube, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  file_size?: number;
  created_at: string;
}

export function ProjectResourcesManager({ projectId }: { projectId: string }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf',
    file: null as File | null,
    externalUrl: ''
  });

  // Cargar recursos
  const loadResources = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/resources`);
      const result = await response.json();
      if (result.success) {
        setResources(result.data);
      } else {
        toast.error('Error al cargar recursos');
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Error al cargar recursos');
    }
  };

  useEffect(() => {
    loadResources();
  }, [projectId]);

  // Agregar recurso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('type', formData.type);
    
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    } else if (formData.externalUrl) {
      formDataToSend.append('externalUrl', formData.externalUrl);
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/resources`, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Recurso agregado exitosamente');
        setShowModal(false);
        loadResources();
        setFormData({ title: '', description: '', type: 'pdf', file: null, externalUrl: '' });
      } else {
        toast.error(result.error || 'Error al agregar recurso');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Error al agregar recurso');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerar URL firmada
  const handleRefreshUrl = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/resources/${resourceId}/signed-url`);
      const result = await response.json();
      
      if (result.success) {
        // Actualizar la URL en la lista de recursos
        setResources(prev => prev.map(resource => 
          resource.id === resourceId 
            ? { ...resource, url: result.data.signedUrl }
            : resource
        ));
        toast.success('URL actualizada exitosamente');
      } else {
        toast.error(result.error || 'Error al actualizar URL');
      }
    } catch (error) {
      console.error('Error refreshing URL:', error);
      toast.error('Error al actualizar URL');
    }
  };

  // Eliminar recurso
  const handleDelete = async (resourceId: string) => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/resources/${resourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Recurso eliminado');
        loadResources();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Error al eliminar recurso');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error al eliminar recurso');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'video_youtube': return <Youtube className="h-5 w-5" />;
      case 'video_file': return <Video className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recursos y Documentación</CardTitle>
          <Button onClick={() => setShowModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Agregar Recurso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay recursos cargados</p>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getIcon(resource.type)}
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    {resource.description && (
                      <p className="text-sm text-gray-500">{resource.description}</p>
                    )}
                    {resource.file_size && (
                      <p className="text-xs text-gray-400">{formatFileSize(resource.file_size)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                    title="Abrir recurso"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  {resource.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefreshUrl(resource.id)}
                      title="Actualizar URL de descarga"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    title="Eliminar recurso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal para agregar recurso */}
      <Modal open={showModal} onOpenChange={setShowModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Agregar Recurso</ModalTitle>
            <ModalDescription>
              Agrega un nuevo recurso o documento al proyecto. Puedes subir archivos o enlaces externos.
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Título del recurso"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional del recurso"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Recurso</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video_youtube">Video YouTube</SelectItem>
                  <SelectItem value="video_file">Archivo de Video</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.type === 'pdf' || formData.type === 'document' || formData.type === 'video_file') && (
              <div className="space-y-2">
                <Label>Archivo</Label>
                <Input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                  accept={
                    formData.type === 'pdf' ? '.pdf' :
                    formData.type === 'document' ? '.doc,.docx,.txt' :
                    formData.type === 'video_file' ? '.mp4,.avi,.mov' : '*'
                  }
                />
              </div>
            )}

            {(formData.type === 'video_youtube' || formData.type === 'link') && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </Card>
  );
}
