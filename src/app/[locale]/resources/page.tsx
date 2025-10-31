'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, FileText, Video, Link as LinkIcon, Download, Eye, Tag, FolderOpen, Calendar, User, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { ResourceVersionsPanel } from '@/components/resources/resource-versions-panel';
import { ResourceStatsDashboard } from '@/components/resources/resource-stats-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  tags: string[];
  url: string;
  s3_key?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  creator_name?: string;
  project_id: string;
  project_name?: string;
  current_version: number;
  view_count?: number;
  download_count?: number;
  relevance_score?: number;
}

export default function ResourcesPage() {
  const { t } = useTranslations();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Manejar query params desde URL - solo una vez al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const previewId = params.get('preview');
      const resourceId = params.get('resourceId');
      const view = params.get('view');
      const projectId = params.get('projectId');

      if (projectId && projectId !== 'all') {
        setProjectFilter(projectId);
      }

      if (previewId) {
        // Cargar el recurso directamente
        fetch(`/api/resources/${previewId}`)
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              setPreviewResource(result.data);
            }
          })
          .catch(err => console.error('Error loading resource:', err));
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (resourceId && view === 'versions') {
        setSelectedResourceId(resourceId);
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  useEffect(() => {
    loadResources();
  }, [searchQuery, categoryFilter, typeFilter, projectFilter, sortBy, currentPage]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        sortBy,
      });

      if (searchQuery) params.append('query', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (projectFilter !== 'all') params.append('projectId', projectFilter);

      const response = await fetch(`/api/resources/search?${params}`);
      const result = await response.json();

      if (result.success) {
        setResources(result.data.results);
        setTotal(result.data.total);
        
        // Extraer categorías únicas
        const uniqueCategories = new Set<string>();
        result.data.results.forEach((r: Resource) => {
          if (r.category) uniqueCategories.add(r.category);
        });
        setCategories(Array.from(uniqueCategories));
      } else {
        toast.error('Error al cargar recursos');
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Error al cargar recursos');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewResource = async (resource: Resource) => {
    try {
      // Registrar acceso
      await fetch(`/api/resources/${resource.id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessType: 'preview' }),
      });

      // Abrir modal de preview
      setPreviewResource(resource);
    } catch (error) {
      console.error('Error previewing resource:', error);
    }
  };

  const getFreshUrl = async (resourceId: string, originalUrl: string, hasS3Key?: boolean): Promise<string> => {
    try {
      // Si la URL parece ser de S3 o el recurso tiene s3_key, obtener una URL firmada fresca
      if (hasS3Key || originalUrl.includes('amazonaws.com')) {
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

  const handleViewResource = async (resource: Resource) => {
    try {
      // Registrar acceso
      await fetch(`/api/resources/${resource.id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessType: 'view' }),
      });

      // Obtener URL fresca y abrir recurso en nueva pestaña
      const freshUrl = await getFreshUrl(resource.id, resource.url, !!resource.s3_key);
      window.open(freshUrl, '_blank');
    } catch (error) {
      console.error('Error viewing resource:', error);
    }
  };

  const handleDownloadResource = async (resource: Resource) => {
    try {
      // Registrar acceso
      await fetch(`/api/resources/${resource.id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessType: 'download' }),
      });

      // Obtener URL fresca y descargar recurso
      const freshUrl = await getFreshUrl(resource.id, resource.url, !!resource.s3_key);
      const link = document.createElement('a');
      link.href = freshUrl;
      link.download = resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'video_youtube':
      case 'video_file':
        return <Video className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <AuthGuard allowedRoles={['admin', 'coordinator']}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Centro de Documentación</h1>
          <p className="text-muted-foreground mt-2">
            Busca y accede a todos los recursos y documentos del proyecto
          </p>
        </div>

        {/* Tabs para cambiar entre Recursos y Estadísticas */}
        <Tabs defaultValue="resources" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <ResourceStatsDashboard projectId={projectFilter !== 'all' ? projectFilter : undefined} />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar recursos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="video_youtube">Video YouTube</SelectItem>
                  <SelectItem value="video_file">Archivo de Video</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={sortBy} onValueChange={(value: any) => {
                setSortBy(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevancia</SelectItem>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recursos {total > 0 && `(${total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando recursos...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron recursos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{resource.title}</h3>
                            {resource.category && (
                              <Badge variant="secondary">
                                <FolderOpen className="h-3 w-3 mr-1" />
                                {resource.category}
                              </Badge>
                            )}
                            <Badge variant="outline">{resource.type}</Badge>
                          </div>
                          
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {resource.description}
                            </p>
                          )}

                          {resource.tags && resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {resource.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                            {resource.project_name && (
                              <span className="flex items-center">
                                <FolderOpen className="h-3 w-3 mr-1" />
                                {resource.project_name}
                              </span>
                            )}
                            {resource.file_size && (
                              <span>{formatFileSize(resource.file_size)}</span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(resource.created_at).toLocaleDateString()}
                            </span>
                            {resource.creator_name && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {resource.creator_name}
                              </span>
                            )}
                            {resource.view_count !== undefined && (
                              <span>{resource.view_count} vistas</span>
                            )}
                            {resource.download_count !== undefined && (
                              <span>{resource.download_count} descargas</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewResource(resource)}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Vista Previa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResource(resource)}
                          title="Abrir en nueva pestaña"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadResource(resource)}
                          title="Descargar recurso"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResourceId(resource.id)}
                          title="Ver versiones"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de Versiones */}
        {selectedResourceId && (
          <ResourceVersionsPanel
            resourceId={selectedResourceId}
            currentVersion={resources.find(r => r.id === selectedResourceId)?.current_version || 1}
            onVersionSelect={() => setSelectedResourceId(null)}
          />
        )}

        {/* Modal de Preview */}
        <ResourcePreviewModal
          resource={previewResource}
          isOpen={!!previewResource}
          onClose={() => setPreviewResource(null)}
          onDownload={() => {
            if (previewResource) {
              handleDownloadResource(previewResource);
            }
          }}
        />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
