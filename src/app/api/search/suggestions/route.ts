import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { handleApiError } from '@/lib/error-handler';

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { query } = await request.json();

    if (!query || query.length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Obtener nombres de proyectos
    const projects = await prisma.projects.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 3,
      select: { name: true }
    });
    projects.forEach(p => suggestions.push(p.name));

    // Obtener nombres de hospitales
    const hospitals = await prisma.hospitals.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 3,
      select: { name: true }
    });
    hospitals.forEach(h => suggestions.push(h.name));

    // Obtener nombres de coordinadores
    const coordinators = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        role: 'coordinator'
      },
      take: 2,
      select: { name: true, email: true }
    });
    coordinators.forEach(c => {
      if (c.name) suggestions.push(c.name);
      if (c.email && !suggestions.includes(c.email)) suggestions.push(c.email);
    });

    // Remover duplicados y limitar
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    return handleApiError(error, request, {
      resource: 'search-suggestions',
      action: 'get',
    });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(handler)(request);
}

