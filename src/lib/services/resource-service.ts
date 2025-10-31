import prisma from '../db-connection';
import { getSignedFileUrl } from './s3-service';

export interface ResourceSearchFilters {
  query?: string;
  projectId?: string;
  category?: string;
  type?: string;
  tags?: string[];
  userId?: string; // Para filtrar por acceso del usuario
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ResourceSearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  tags: string[];
  url: string;
  file_size?: number;
  mime_type?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  creator_name?: string;
  project_id: string;
  project_name?: string;
  current_version: number;
  view_count?: number;
  download_count?: number;
  relevance_score?: number; // Para búsqueda
}

export interface ResourceVersion {
  id: string;
  resource_id: string;
  version_number: number;
  title: string;
  description?: string;
  url: string;
  file_size?: number;
  mime_type?: string;
  change_notes?: string;
  created_at: Date;
  created_by: string;
  creator_name?: string;
}

export interface ResourceStats {
  total_resources: number;
  by_category: { category: string; count: number }[];
  by_type: { type: string; count: number }[];
  most_viewed: { resource_id: string; title: string; view_count: number }[];
  most_downloaded: { resource_id: string; title: string; download_count: number }[];
  recent_access: { resource_id: string; title: string; last_accessed: Date }[];
  total_views: number;
  total_downloads: number;
}

/**
 * Servicio para gestión avanzada de recursos y documentación
 */
export class ResourceService {
  /**
   * Búsqueda full-text de recursos con filtros avanzados
   */
  static async searchResources(
    filters: ResourceSearchFilters,
    options: { limit?: number; offset?: number; sortBy?: 'relevance' | 'date' | 'title' } = {}
  ): Promise<{ results: ResourceSearchResult[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
    } = options;

    // Construir condiciones WHERE
    const where: any = {};

    if (filters.projectId) {
      where.project_id = filters.projectId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasEvery: filters.tags,
      };
    }

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    } else {
      // Por defecto, solo recursos activos
      where.is_active = true;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.created_at = {};
      if (filters.createdAfter) {
        where.created_at.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.created_at.lte = filters.createdBefore;
      }
    }

    // Búsqueda full-text en título, descripción y contenido indexable
    if (filters.query && filters.query.trim()) {
      const query = filters.query.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { searchable_content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }, // Búsqueda en tags
      ];
    }

    // Contar total de resultados
    const total = await prisma.project_resources.count({ where });

    // Determinar ordenamiento
    let orderBy: any = {};
    if (sortBy === 'relevance' && filters.query) {
      // Para relevancia, ordenar por título que contenga la query primero
      // PostgreSQL no tiene full-text search nativo sin extensiones, usamos ILIKE
      orderBy = [
        { title: 'asc' }, // Esto será sobrescrito por una query más compleja
      ];
    } else if (sortBy === 'date') {
      orderBy = { created_at: 'desc' };
    } else {
      orderBy = { title: 'asc' };
    }

    // Obtener recursos
    const resources = await prisma.project_resources.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
      include: {
        creator: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Obtener estadísticas de acceso para cada recurso
    const resourceIds = resources.map((r) => r.id);
    const accessStats = await prisma.resource_access_logs.groupBy({
      by: ['resource_id', 'access_type'],
      where: {
        resource_id: { in: resourceIds },
      },
      _count: {
        id: true,
      },
    });

    // Construir mapa de estadísticas
    const statsMap = new Map<string, { views: number; downloads: number }>();
    accessStats.forEach((stat) => {
      const existing = statsMap.get(stat.resource_id) || { views: 0, downloads: 0 };
      if (stat.access_type === 'view' || stat.access_type === 'preview') {
        existing.views += stat._count.id;
      } else if (stat.access_type === 'download') {
        existing.downloads += stat._count.id;
      }
      statsMap.set(stat.resource_id, existing);
    });

    // Calcular relevancia para búsqueda (simple scoring)
    const calculateRelevance = (resource: any, query?: string): number => {
      if (!query) return 1;
      const lowerQuery = query.toLowerCase();
      let score = 0;

      // Título exacto o contiene: más peso
      if (resource.title.toLowerCase().includes(lowerQuery)) {
        score += 10;
        if (resource.title.toLowerCase() === lowerQuery) {
          score += 5; // Bonus por coincidencia exacta
        }
      }

      // Descripción contiene: peso medio
      if (resource.description?.toLowerCase().includes(lowerQuery)) {
        score += 5;
      }

      // Tags contiene: peso alto
      if (resource.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
        score += 8;
      }

      return score;
    };

    // Formatear resultados
    const results: ResourceSearchResult[] = resources.map((resource) => {
      const stats = statsMap.get(resource.id) || { views: 0, downloads: 0 };
      const relevance = calculateRelevance(resource, filters.query);

      return {
        id: resource.id,
        title: resource.title,
        description: resource.description || undefined,
        type: resource.type,
        category: resource.category || undefined,
        tags: resource.tags || [],
        url: resource.url,
        file_size: resource.file_size || undefined,
        mime_type: resource.mime_type || undefined,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        created_by: resource.created_by,
        creator_name: resource.creator?.name || undefined,
        project_id: resource.project_id,
        project_name: resource.project?.name || undefined,
        current_version: resource.current_version,
        view_count: stats.views,
        download_count: stats.downloads,
        relevance_score: relevance,
      };
    });

    // Ordenar por relevancia si es búsqueda
    if (sortBy === 'relevance' && filters.query) {
      results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }

    return { results, total };
  }

  /**
   * Obtener un recurso por ID con información completa
   */
  static async getResourceById(resourceId: string, includeVersions = false): Promise<any> {
    const resource = await prisma.project_resources.findUnique({
      where: { id: resourceId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        versions: includeVersions
          ? {
              orderBy: { version_number: 'desc' },
              include: {
                creator: {
                  select: { id: true, name: true },
                },
              },
            }
          : false,
        access_logs: {
          take: 10,
          orderBy: { accessed_at: 'desc' },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!resource) {
      return null;
    }

    // Obtener estadísticas de acceso
    const stats = await prisma.resource_access_logs.groupBy({
      by: ['access_type'],
      where: { resource_id: resourceId },
      _count: { id: true },
    });

    const accessStats = {
      views: 0,
      downloads: 0,
      previews: 0,
    };

    stats.forEach((stat) => {
      if (stat.access_type === 'view') accessStats.views += stat._count.id;
      else if (stat.access_type === 'download') accessStats.downloads += stat._count.id;
      else if (stat.access_type === 'preview') accessStats.previews += stat._count.id;
    });

    return {
      ...resource,
      access_stats: accessStats,
    };
  }

  /**
   * Registrar acceso a un recurso (view, download, preview)
   */
  static async logResourceAccess(
    resourceId: string,
    accessType: 'view' | 'download' | 'preview',
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.resource_access_logs.create({
      data: {
        resource_id: resourceId,
        user_id: userId,
        access_type: accessType,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  }

  /**
   * Obtener estadísticas de recursos
   */
  static async getResourceStats(
    projectId?: string,
    filters?: { category?: string; type?: string }
  ): Promise<ResourceStats> {
    const where: any = { is_active: true };
    if (projectId) {
      where.project_id = projectId;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    // Contar total
    const total_resources = await prisma.project_resources.count({ where });

    // Agrupar por categoría
    const allResources = await prisma.project_resources.findMany({
      where,
      select: { category: true, type: true, id: true, title: true },
    });

    const by_category = new Map<string, number>();
    const by_type = new Map<string, number>();

    allResources.forEach((resource) => {
      const cat = resource.category || 'Sin categoría';
      by_category.set(cat, (by_category.get(cat) || 0) + 1);

      by_type.set(resource.type, (by_type.get(resource.type) || 0) + 1);
    });

    // Obtener IDs de recursos que cumplen los filtros
    const filteredResourceIds = (
      await prisma.project_resources.findMany({
        where,
        select: { id: true },
      })
    ).map((r) => r.id);

    // Obtener recursos más vistos
    const viewStats = filteredResourceIds.length > 0
      ? await prisma.resource_access_logs.groupBy({
          by: ['resource_id'],
          where: {
            resource_id: { in: filteredResourceIds },
            access_type: { in: ['view', 'preview'] },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        })
      : [];

    const most_viewed = await Promise.all(
      viewStats.map(async (stat) => {
        const resource = await prisma.project_resources.findUnique({
          where: { id: stat.resource_id },
          select: { title: true },
        });
        return {
          resource_id: stat.resource_id,
          title: resource?.title || 'Unknown',
          view_count: stat._count.id,
        };
      })
    );

    // Obtener recursos más descargados
    const downloadStats = filteredResourceIds.length > 0
      ? await prisma.resource_access_logs.groupBy({
          by: ['resource_id'],
          where: {
            resource_id: { in: filteredResourceIds },
            access_type: 'download',
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        })
      : [];

    const most_downloaded = await Promise.all(
      downloadStats.map(async (stat) => {
        const resource = await prisma.project_resources.findUnique({
          where: { id: stat.resource_id },
          select: { title: true },
        });
        return {
          resource_id: stat.resource_id,
          title: resource?.title || 'Unknown',
          download_count: stat._count.id,
        };
      })
    );

    // Accesos recientes
    const recentAccessLogs = filteredResourceIds.length > 0
      ? await prisma.resource_access_logs.findMany({
          where: {
            resource_id: { in: filteredResourceIds },
          },
          orderBy: { accessed_at: 'desc' },
          distinct: ['resource_id'],
          take: 10,
          include: {
            resource: {
              select: { id: true, title: true },
            },
          },
        })
      : [];

    const recent_access = recentAccessLogs.map((access) => ({
      resource_id: access.resource.id,
      title: access.resource.title,
      last_accessed: access.accessed_at,
    }));

    // Total de vistas y descargas
    const totalViews = filteredResourceIds.length > 0
      ? await prisma.resource_access_logs.count({
          where: {
            resource_id: { in: filteredResourceIds },
            access_type: { in: ['view', 'preview'] },
          },
        })
      : 0;

    const totalDownloads = filteredResourceIds.length > 0
      ? await prisma.resource_access_logs.count({
          where: {
            resource_id: { in: filteredResourceIds },
            access_type: 'download',
          },
        })
      : 0;

    return {
      total_resources,
      by_category: Array.from(by_category.entries()).map(([category, count]) => ({
        category,
        count,
      })),
      by_type: Array.from(by_type.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      most_viewed,
      most_downloaded,
      recent_access,
      total_views: totalViews,
      total_downloads: totalDownloads,
    };
  }

  /**
   * Crear nueva versión de un recurso
   */
  static async createResourceVersion(
    resourceId: string,
    data: {
      title?: string;
      description?: string;
      url?: string;
      s3_key?: string;
      file_size?: number;
      mime_type?: string;
      change_notes?: string;
      created_by: string;
    }
  ): Promise<ResourceVersion> {
    // Obtener recurso actual
    const currentResource = await prisma.project_resources.findUnique({
      where: { id: resourceId },
    });

    if (!currentResource) {
      throw new Error('Recurso no encontrado');
    }

    // Crear registro de versión con datos actuales
    const version = await prisma.resource_versions.create({
      data: {
        resource_id: resourceId,
        version_number: currentResource.current_version,
        title: data.title || currentResource.title,
        description: data.description || currentResource.description,
        url: data.url || currentResource.url,
        s3_key: data.s3_key || currentResource.s3_key,
        file_size: data.file_size || currentResource.file_size,
        mime_type: data.mime_type || currentResource.mime_type,
        change_notes: data.change_notes,
        created_by: data.created_by,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    // Incrementar versión del recurso
    await prisma.project_resources.update({
      where: { id: resourceId },
      data: {
        current_version: currentResource.current_version + 1,
        title: data.title || currentResource.title,
        description: data.description || currentResource.description,
        url: data.url || currentResource.url,
        s3_key: data.s3_key || currentResource.s3_key,
        file_size: data.file_size || currentResource.file_size,
        mime_type: data.mime_type || currentResource.mime_type,
        is_latest: true,
      },
    });

    return {
      id: version.id,
      resource_id: version.resource_id,
      version_number: version.version_number,
      title: version.title,
      description: version.description || undefined,
      url: version.url,
      file_size: version.file_size || undefined,
      mime_type: version.mime_type || undefined,
      change_notes: version.change_notes || undefined,
      created_at: version.created_at,
      created_by: version.created_by,
      creator_name: version.creator?.name || undefined,
    };
  }

  /**
   * Obtener todas las versiones de un recurso
   */
  static async getResourceVersions(resourceId: string): Promise<ResourceVersion[]> {
    const versions = await prisma.resource_versions.findMany({
      where: { resource_id: resourceId },
      orderBy: { version_number: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      resource_id: v.resource_id,
      version_number: v.version_number,
      title: v.title,
      description: v.description || undefined,
      url: v.url,
      file_size: v.file_size || undefined,
      mime_type: v.mime_type || undefined,
      change_notes: v.change_notes || undefined,
      created_at: v.created_at,
      created_by: v.created_by,
      creator_name: v.creator?.name || undefined,
    }));
  }

  /**
   * Obtener URL firmada para acceso seguro a un recurso
   */
  static async getSignedResourceUrl(
    resourceId: string,
    expiresInSeconds = 7 * 24 * 3600 // 7 días por defecto
  ): Promise<string> {
    const resource = await prisma.project_resources.findUnique({
      where: { id: resourceId },
      select: { s3_key: true, url: true },
    });

    if (!resource) {
      throw new Error('Recurso no encontrado');
    }

    // Si tiene s3_key, generar URL firmada
    if (resource.s3_key) {
      return await getSignedFileUrl(resource.s3_key, expiresInSeconds);
    }

    // Si no, devolver URL directa
    return resource.url;
  }
}
