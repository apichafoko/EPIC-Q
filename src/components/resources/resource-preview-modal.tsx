'use client';

import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ResourcePreviewModalProps {
  resource: {
    id: string;
    title: string;
    type: string;
    url: string;
    mime_type?: string;
    s3_key?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function ResourcePreviewModal({
  resource,
  isOpen,
  onClose,
  onDownload,
}: ResourcePreviewModalProps) {
  // Todos los hooks deben estar antes de cualquier early return
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);

  useEffect(() => {
    // Resetear estados cuando se cierra el modal o no hay recurso
    if (!resource || !isOpen) {
      setLoading(true);
      setError(null);
      setIsImage(false);
      setIsPdf(false);
      setIsVideo(false);
      setIsYouTube(false);
      setYoutubeId(null);
      return;
    }

    if (resource && isOpen) {
      setLoading(true);
      setError(null);

      // Si el recurso tiene s3_key, obtener una URL firmada fresca
      const loadResourceUrl = async () => {
        try {
          let url = resource.url;
          
          // Si tiene s3_key, obtener URL firmada fresca (1 hora de validez para preview)
          if (resource.s3_key || (resource.url && resource.url.includes('amazonaws.com'))) {
            const response = await fetch(`/api/resources/${resource.id}/signed-url?expiresIn=3600`);
            const result = await response.json();
            if (result.success && result.data.url) {
              url = result.data.url;
            }
          }
          
          setResourceUrl(url);
          
          // Determinar tipo de contenido con la URL fresca
          const mimeType = resource.mime_type?.toLowerCase() || '';
          const type = resource.type.toLowerCase();

          // Verificar si es imagen
          if (
            type === 'image' ||
            mimeType.startsWith('image/') ||
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
          ) {
        setIsImage(true);
        setIsPdf(false);
        setIsVideo(false);
        setIsYouTube(false);
        setLoading(false);
        return;
      }

          // Verificar si es PDF
          if (
            type === 'pdf' ||
            type === 'document' ||
            mimeType === 'application/pdf' ||
            url.toLowerCase().endsWith('.pdf')
          ) {
        setIsPdf(true);
        setIsImage(false);
        setIsVideo(false);
        setIsYouTube(false);
        setLoading(false);
        return;
      }

          // Verificar si es video de YouTube
          if (type === 'video_youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        setIsYouTube(true);
        setIsImage(false);
        setIsPdf(false);
        setIsVideo(false);

        // Extraer ID de YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(youtubeRegex);
        if (match && match[1]) {
          setYoutubeId(match[1]);
        }
        setLoading(false);
        return;
      }

          // Verificar si es video
          if (
            type === 'video_file' ||
            mimeType.startsWith('video/') ||
            /\.(mp4|avi|mov|webm|ogg)$/i.test(url)
          ) {
            setIsVideo(true);
            setIsImage(false);
            setIsPdf(false);
            setIsYouTube(false);
            setLoading(false);
            return;
          }

          // Por defecto, intentar abrir en iframe o mostrar link
          setIsImage(false);
          setIsPdf(false);
          setIsVideo(false);
          setIsYouTube(false);
          setLoading(false);
        } catch (err) {
          console.error('Error loading resource URL:', err);
          setError('Error al cargar el recurso');
          setLoading(false);
        }
      };

      loadResourceUrl();
    }
  }, [resource, isOpen]);

  // Handlers - deben estar después de todos los hooks
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else if (resource) {
      try {
        // Obtener URL fresca para descarga
        let url = resource.url;
        if (resource.s3_key || (resource.url && resource.url.includes('amazonaws.com'))) {
          const response = await fetch(`/api/resources/${resource.id}/signed-url?expiresIn=3600`);
          const result = await response.json();
          if (result.success && result.data.url) {
            url = result.data.url;
          }
        }
        
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error downloading resource:', err);
      }
    }
  };

  const handleOpenExternal = async () => {
    if (resource) {
      try {
        // Obtener URL fresca
        let url = resource.url;
        if (resource.s3_key || (resource.url && resource.url.includes('amazonaws.com'))) {
          const response = await fetch(`/api/resources/${resource.id}/signed-url?expiresIn=3600`);
          const result = await response.json();
          if (result.success && result.data.url) {
            url = result.data.url;
          }
        }
        window.open(url, '_blank');
      } catch (err) {
        console.error('Error opening resource:', err);
        window.open(resource.url, '_blank'); // Fallback a URL original
      }
    }
  };

  // Función de renderizado - después de todos los hooks
  const renderContent = () => {
    if (!resource) {
      return null;
    }
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleOpenExternal} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir en nueva pestaña
          </Button>
        </div>
      );
    }

    if (isImage && resourceUrl) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/50 p-4">
          <img
            src={resourceUrl}
            alt={resource.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
            onError={() => setError('Error al cargar la imagen')}
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (isPdf && resourceUrl) {
      return (
        <div className="w-full h-[80vh]">
          <iframe
            src={resourceUrl}
            className="w-full h-full border-0 rounded-lg"
            title={resource.title}
            onLoad={() => setLoading(false)}
            onError={() => setError('Error al cargar el PDF')}
          />
        </div>
      );
    }

    if (isYouTube && youtubeId) {
      return (
        <div className="w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={resource.title}
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (isVideo && resourceUrl) {
      return (
        <div className="w-full">
          <video
            src={resourceUrl}
            controls
            className="w-full max-h-[80vh] rounded-lg"
            onLoadStart={() => setLoading(false)}
            onError={() => setError('Error al cargar el video')}
          >
            Tu navegador no soporta el elemento de video.
          </video>
        </div>
      );
    }

    // Por defecto, mostrar link externo
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold mb-2">{resource.title}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Este tipo de recurso no se puede previsualizar aquí
          </p>
          <div className="flex items-center space-x-2">
            <Button onClick={handleOpenExternal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render - no usar early return para evitar problemas con hooks
  // El Dialog maneja internamente el estado de isOpen
  return (
    <Dialog open={isOpen && !!resource} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {isImage && <ImageIcon className="h-5 w-5" />}
              {isPdf && <FileText className="h-5 w-5" />}
              {isVideo && <Video className="h-5 w-5" />}
              {!isVideo && !isPdf && !isImage && <FileText className="h-5 w-5" />}
              <span>{resource?.title || ''}</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-background">
          {resource ? renderContent() : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
