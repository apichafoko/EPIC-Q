import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth/middleware';
import { prisma } from '../../../../lib/database';
import { SearchResult, SearchFilters } from '../../../../lib/global-search-service';

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {}, limit = 20 } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];

    // Buscar proyectos
    if (!filters.types || filters.types.includes('project')) {
      const projects = await prisma.projects.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          created_at: true
        }
      });

      projects.forEach(project => {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.description || 'Sin descripción',
          url: `/es/admin/projects/${project.id}`,
          metadata: {
            status: project.status,
            created_at: project.created_at
          },
          score: calculateScore(project.name, query)
        });
      });
    }

    // Buscar hospitales
    if (!filters.types || filters.types.includes('hospital')) {
      const hospitalWhere: any = {
        name: {
          contains: query,
          mode: 'insensitive'
        },
        status: 'active'
      };

      // Filtrar por proyecto si se especifica
      if (filters.projects && filters.projects.length > 0) {
        hospitalWhere.project_hospitals = {
          some: {
            project_id: {
              in: filters.projects
            }
          }
        };
      }

      const hospitals = await prisma.hospitals.findMany({
        where: hospitalWhere,
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          name: true,
          city: true,
          province: true,
          status: true,
          project_hospitals: {
            select: {
              projects: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      hospitals.forEach(hospital => {
        const project = hospital.project_hospitals[0]?.projects;
        results.push({
          id: hospital.id,
          type: 'hospital',
          title: hospital.name,
          description: `${hospital.city || 'Sin ciudad'}, ${hospital.province || 'Sin provincia'}`,
          url: `/es/admin/hospitals/${hospital.id}`,
          metadata: {
            status: hospital.status,
            city: hospital.city,
            province: hospital.province,
            project: project?.name
          },
          score: calculateScore(hospital.name, query)
        });
      });
    }

    // Buscar coordinadores
    if (!filters.types || filters.types.includes('coordinator')) {
      const coordinatorWhere: any = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        role: 'coordinator',
        isActive: true
      };

      // Filtrar por proyecto si se especifica
      if (filters.projects && filters.projects.length > 0) {
        coordinatorWhere.project_coordinators = {
          some: {
            project_id: {
              in: filters.projects
            }
          }
        };
      }

      const coordinators = await prisma.users.findMany({
        where: coordinatorWhere,
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          project_coordinators: {
            select: {
              projects: {
                select: {
                  id: true,
                  name: true
                }
              },
              hospitals: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      coordinators.forEach(coordinator => {
        const projectCoordinator = coordinator.project_coordinators[0];
        const project = projectCoordinator?.projects;
        const hospital = projectCoordinator?.hospitals;

        results.push({
          id: coordinator.id,
          type: 'coordinator',
          title: coordinator.name || 'Sin nombre',
          description: `${coordinator.email} - ${hospital?.name || 'Sin hospital asignado'}`,
          url: `/es/admin/coordinators/${coordinator.id}`,
          metadata: {
            email: coordinator.email,
            isActive: coordinator.isActive,
            project: project?.name,
            hospital: hospital?.name
          },
          score: Math.max(
            calculateScore(coordinator.name || '', query),
            calculateScore(coordinator.email, query)
          )
        });
      });
    }

    // Buscar alertas
    if (!filters.types || filters.types.includes('alert')) {
      const alerts = await prisma.alerts.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { message: { contains: query, mode: 'insensitive' } }
          ],
          is_resolved: false
        },
        take: Math.ceil(limit / 6),
        select: {
          id: true,
          title: true,
          message: true,
          severity: true,
          created_at: true,
          hospitals: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      alerts.forEach(alert => {
        results.push({
          id: alert.id,
          type: 'alert',
          title: alert.title,
          description: alert.message.substring(0, 100) + (alert.message.length > 100 ? '...' : ''),
          url: `/es/admin/alerts/${alert.id}`,
          metadata: {
            severity: alert.severity,
            created_at: alert.created_at,
            hospital: alert.hospitals?.name
          },
          highlighted: {
            title: highlightText(alert.title, query),
            description: highlightText(alert.message, query)
          },
          score: Math.max(
            calculateScore(alert.title, query),
            calculateScore(alert.message, query) * 0.7
          )
        });
      });
    }

    // Buscar comunicaciones
    if (!filters.types || filters.types.includes('communication')) {
      const communications = await prisma.communications.findMany({
        where: {
          OR: [
            { subject: { contains: query, mode: 'insensitive' } },
            { body: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: Math.ceil(limit / 6),
        select: {
          id: true,
          subject: true,
          body: true,
          type: true,
          created_at: true,
          hospitals: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      communications.forEach(comm => {
        results.push({
          id: comm.id,
          type: 'communication',
          title: comm.subject,
          description: comm.body.substring(0, 100).replace(/<[^>]*>/g, '') + (comm.body.length > 100 ? '...' : ''),
          url: `/es/admin/communications/${comm.id}`,
          metadata: {
            type: comm.type,
            created_at: comm.created_at,
            hospital: comm.hospitals?.name
          },
          highlighted: {
            title: highlightText(comm.subject, query),
            description: highlightText(comm.body.replace(/<[^>]*>/g, ''), query)
          },
          score: Math.max(
            calculateScore(comm.subject, query),
            calculateScore(comm.body, query) * 0.5
          )
        });
      });
    }

    // Ordenar por score y limitar resultados
    const sortedResults = results
      .sort((a, b) => {
        // Ordenar por score descendente
        if (b.score !== a.score) return b.score - a.score;
        // Si tienen el mismo score, ordenar por tipo (alertas primero, luego hospitales, etc.)
        const typePriority: Record<string, number> = {
          alert: 5,
          hospital: 4,
          coordinator: 3,
          project: 2,
          communication: 1,
          user: 0
        };
        return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
      })
      .slice(0, limit);

    return NextResponse.json({ results: sortedResults });

  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Resaltar texto con el query
 */
function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  const words = query.trim().split(/\s+/).filter(w => w.length > 0);
  let highlighted = text;
  
  words.forEach(word => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-1 rounded font-semibold">$1</mark>');
  });
  
  return highlighted;
}

function calculateScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Score exacto
  if (textLower === queryLower) return 100;

  // Score por inicio
  if (textLower.startsWith(queryLower)) return 90;

  // Score por palabra completa
  const words = textLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  
  let wordScore = 0;
  queryWords.forEach(queryWord => {
    words.forEach(word => {
      if (word.startsWith(queryWord)) {
        wordScore += 80;
      } else if (word.includes(queryWord)) {
        wordScore += 60;
      }
    });
  });

  if (wordScore > 0) return wordScore;

  // Score por contenido
  if (textLower.includes(queryLower)) return 50;

  return 0;
}
