'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '../../../../hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { FileText, Video, Link as LinkIcon, Youtube, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { AuthGuard } from '../../../../components/auth/auth-guard';
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

  // Función para obtener URL fresca (siempre para recursos S3)
  const getFreshUrl = async (resourceId: string, originalUrl: string): Promise<string> => {
    try {
      // Si la URL parece ser de S3 (amazonaws.com), obtener una URL firmada fresca
      if (originalUrl.includes('amazonaws.com')) {
        // Intentar usar el endpoint genérico primero
        let response = await fetch(`/api/resources/${resourceId}/signed-url?expiresIn=3600`).catch(() => null);
        
        // Si falla, intentar el endpoint específico del coordinador
        if (!response || !response.ok) {
          response = await fetch(`/api/coordinator/project-info/resources/${resourceId}/signed-url`);
        }
        
        if (response && response.ok) {
          const result = await response.json();
          if (result.success && (result.data.url || result.data.signedUrl)) {
            return result.data.url || result.data.signedUrl;
          }
        }
      }
      return originalUrl;
    } catch (error) {
      console.error('Error getting fresh URL:', error);
      return originalUrl; // Fallback a URL original
    }
  };

  // Función principal para manejar la descarga/apertura de recursos
  const handleResourceAction = async (resource: Resource) => {
    try {
      // Marcar como refrescando
      setRefreshingResources(prev => new Set(prev).add(resource.id));
      
      // Obtener URL fresca (siempre para recursos S3)
      const freshUrl = await getFreshUrl(resource.id, resource.url);
      
      // Abrir la URL fresca
      window.open(freshUrl, '_blank');
      
      // Si la URL cambió, actualizar el estado
      if (freshUrl !== resource.url) {
        setProjectInfo((prev: any) => ({
          ...prev,
          resources: prev.resources.map((r: Resource) => 
            r.id === resource.id ? { ...r, url: freshUrl } : r
          )
        }));
      }
      
      // Quitar del estado de refrescando
      setRefreshingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(resource.id);
        return newSet;
      });
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

  // Función para verificar si una URL está próxima a expirar o expirada
  const isUrlNearExpiry = (url: string): boolean => {
    try {
      // Parsear la URL para obtener los parámetros
      const urlObj = new URL(url);
      const expiresParam = urlObj.searchParams.get('Expires');
      
      if (expiresParam) {
        const expiresTimestamp = parseInt(expiresParam);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeRemaining = expiresTimestamp - currentTimestamp;
        
        // Regenerar si queda menos de 1 hora o si ya expiró
        return timeRemaining < 3600;
      }
      
      // Si no tiene parámetro Expires pero tiene s3_key, regenerar por si acaso
      return url.includes('amazonaws.com');
    } catch (error) {
      console.error('Error checking URL expiry:', error);
      // En caso de error, asumir que necesita regenerarse si es una URL de S3
      return url.includes('amazonaws.com');
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
