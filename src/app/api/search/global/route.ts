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

    // Ordenar por score y limitar resultados
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
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
