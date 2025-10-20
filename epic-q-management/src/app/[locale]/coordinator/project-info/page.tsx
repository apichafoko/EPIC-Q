'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Video, Link as LinkIcon, Youtube, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  file_size?: number;
  s3_key?: string;
}

export default function ProjectInfoPage() {
  const { t } = useTranslations();
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingResources, setRefreshingResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectInfo();
  }, []);

  const loadProjectInfo = async () => {
    try {
      const response = await fetch('/api/coordinator/project-info');
      const result = await response.json();
      if (result.success) {
        setProjectInfo(result.data);
      } else {
        console.error('Error loading project info:', result.error);
      }
    } catch (error) {
      console.error('Error loading project info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para regenerar URL firmada automáticamente
  const refreshResourceUrl = async (resourceId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/coordinator/project-info/resources/${resourceId}/signed-url`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.signedUrl;
      } else {
        console.error('Error refreshing URL:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing URL:', error);
      return null;
    }
  };

  // Función principal para manejar la descarga/apertura de recursos
  const handleResourceAction = async (resource: Resource) => {
    try {
      // Si es un archivo (tiene s3_key), verificar si la URL está próxima a expirar
      if (resource.s3_key && isUrlNearExpiry(resource.url)) {
        // Marcar como refrescando
        setRefreshingResources(prev => new Set(prev).add(resource.id));
        
        // Regenerar URL automáticamente
        const newUrl = await refreshResourceUrl(resource.id);
        
        if (newUrl) {
          // Actualizar la URL en el estado
          setProjectInfo(prev => ({
            ...prev,
            resources: prev.resources.map((r: Resource) => 
              r.id === resource.id ? { ...r, url: newUrl } : r
            )
          }));
          
          // Abrir la nueva URL
          window.open(newUrl, '_blank');
          toast.success('Enlace actualizado y abierto');
        } else {
          toast.error('Error al actualizar enlace de descarga');
        }
        
        // Quitar del estado de refrescando
        setRefreshingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(resource.id);
          return newSet;
        });
      } else {
        // Para enlaces externos o URLs que no están próximas a expirar, abrir directamente
        window.open(resource.url, '_blank');
      }
    } catch (error) {
      console.error('Error handling resource action:', error);
      toast.error('Error al abrir el recurso');
      
      // Quitar del estado de refrescando en caso de error
      setRefreshingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(resource.id);
        return newSet;
      });
    }
  };

  // Función para verificar si una URL está próxima a expirar (menos de 1 hora)
  const isUrlNearExpiry = (url: string): boolean => {
    try {
      if (url.includes('X-Amz-Expires=')) {
        const expiresMatch = url.match(/X-Amz-Expires=(\d+)/);
        if (expiresMatch) {
          const expiresIn = parseInt(expiresMatch[1]);
          // Si expira en menos de 1 hora (3600 segundos), regenerar
          return expiresIn < 3600;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking URL expiry:', error);
      return false;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'video_youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      case 'video_file': return <Video className="h-5 w-5 text-blue-500" />;
      case 'link': return <LinkIcon className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['coordinator']}>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Información del Proyecto
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Documentación y recursos del proyecto {projectInfo?.project?.name}
          </p>
        </div>

        {/* Descripción del Proyecto */}
        {projectInfo?.project?.brief_description && (
          <Card>
            <CardHeader>
              <CardTitle>Sobre el Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {projectInfo.project.brief_description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recursos y Documentación */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos Disponibles</CardTitle>
            <CardDescription>
              Documentos, videos y enlaces relacionados con el proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectInfo?.resources?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay recursos disponibles en este momento
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectInfo?.resources?.map((resource: Resource) => (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getIcon(resource.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          {resource.file_size && (
                            <p className="text-xs text-gray-500">{formatFileSize(resource.file_size)}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {resource.type === 'pdf' && 'PDF'}
                        {resource.type === 'video_youtube' && 'YouTube'}
                        {resource.type === 'video_file' && 'Video'}
                        {resource.type === 'link' && 'Link'}
                        {resource.type === 'document' && 'Documento'}
                      </Badge>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleResourceAction(resource)}
                      disabled={refreshingResources.has(resource.id)}
                    >
                      {refreshingResources.has(resource.id) ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Actualizando...
                        </>
                      ) : resource.type === 'pdf' || resource.type === 'document' || resource.type === 'video_file' ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
