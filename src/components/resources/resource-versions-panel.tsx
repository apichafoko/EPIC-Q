'use client';

import { useState, useEffect } from 'react';
import { History, Download, Eye, User, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ResourceVersion {
  id: string;
  resource_id: string;
  version_number: number;
  title: string;
  description?: string;
  url: string;
  file_size?: number;
  mime_type?: string;
  change_notes?: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

interface ResourceVersionsPanelProps {
  resourceId: string;
  currentVersion: number;
  onVersionSelect?: (version: ResourceVersion) => void;
}

export function ResourceVersionsPanel({
  resourceId,
  currentVersion,
  onVersionSelect,
}: ResourceVersionsPanelProps) {
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [resourceId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resources/${resourceId}/versions`);
      const result = await response.json();

      if (result.success) {
        setVersions(result.data);
      } else {
        toast.error('Error al cargar versiones');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Error al cargar versiones');
    } finally {
      setLoading(false);
    }
  };

  const getFreshUrl = async (resourceId: string, originalUrl: string): Promise<string> => {
    try {
      // Si la URL parece ser de S3 (amazonaws.com), obtener una URL firmada fresca
      if (originalUrl.includes('amazonaws.com')) {
        const response = await fetch(`/api/resources/${resourceId}/signed-url?expiresIn=3600`);
        const result = await response.json();
        if (result.success && result.data.url) {
          return result.data.url;
        }
      }
      return originalUrl;
    } catch (error) {
      console.error('Error getting fresh URL:', error);
      return originalUrl; // Fallback a URL original
    }
  };

  const handleViewVersion = async (version: ResourceVersion) => {
    try {
      const freshUrl = await getFreshUrl(version.resource_id, version.url);
      window.open(freshUrl, '_blank');
    } catch (error) {
      console.error('Error viewing version:', error);
      window.open(version.url, '_blank'); // Fallback
    }
  };

  const handleDownloadVersion = async (version: ResourceVersion) => {
    try {
      const freshUrl = await getFreshUrl(version.resource_id, version.url);
      const link = document.createElement('a');
      link.href = freshUrl;
      link.download = `${version.title} - v${version.version_number}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading version:', error);
      // Fallback a URL original
      const link = document.createElement('a');
      link.href = version.url;
      link.download = `${version.title} - v${version.version_number}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Versiones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando versiones...</p>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Historial de Versiones</span>
          </CardTitle>
          <CardDescription>
            Versión actual: {currentVersion}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay versiones anteriores de este recurso
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Historial de Versiones</span>
        </CardTitle>
        <CardDescription>
          Versión actual: {currentVersion} • {versions.length} versión{versions.length !== 1 ? 'es' : ''} en total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id}>
                <div
                  className={`p-4 rounded-lg border ${
                    version.version_number === currentVersion
                      ? 'bg-primary/5 border-primary'
                      : 'bg-card border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          version.version_number === currentVersion ? 'default' : 'secondary'
                        }
                      >
                        v{version.version_number}
                        {version.version_number === currentVersion && ' (Actual)'}
                      </Badge>
                      <span className="font-semibold">{version.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVersion(version)}
                        title="Ver versión"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadVersion(version)}
                        title="Descargar versión"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {version.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {version.description}
                    </p>
                  )}

                  {version.change_notes && (
                    <div className="bg-muted/50 p-3 rounded-md mb-2">
                      <p className="text-xs font-semibold mb-1 flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Notas de cambios:
                      </p>
                      <p className="text-xs text-muted-foreground">{version.change_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                    {version.file_size && (
                      <span>{formatFileSize(version.file_size)}</span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(version.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {version.creator_name && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {version.creator_name}
                      </span>
                    )}
                  </div>
                </div>
                {index < versions.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
