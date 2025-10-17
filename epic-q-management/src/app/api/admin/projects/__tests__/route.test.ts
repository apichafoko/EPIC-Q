import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { prisma } from '@/lib/database';

// Mock de Prisma
jest.mock('@/lib/database', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock de middleware de autenticación
jest.mock('@/lib/auth/middleware', () => ({
  withAdminAuth: (handler: any) => handler,
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/admin/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return projects list with pagination', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Test Project',
          description: 'Test Description',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          _count: {
            project_hospitals: 2,
            project_coordinators: 1,
          },
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.project.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/projects');
      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.projects).toEqual(mockProjects);
      expect(data.pagination).toBeDefined();
    });

    it('should filter projects by status', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Active Project',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          _count: {
            project_hospitals: 1,
            project_coordinators: 1,
          },
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.project.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/projects?status=active');
      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      );
    });
  });

  describe('POST', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_target_cases: 1000,
      };

      const mockCreatedProject = {
        id: '1',
        ...projectData,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        _count: {
          project_hospitals: 0,
          project_coordinators: 0,
        },
      };

      mockPrisma.project.create.mockResolvedValue(mockCreatedProject);

      const request = new NextRequest('http://localhost:3000/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.project).toEqual(mockCreatedProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: projectData.name,
            description: projectData.description,
            start_date: new Date(projectData.start_date),
            end_date: new Date(projectData.end_date),
            total_target_cases: projectData.total_target_cases,
          }),
        })
      );
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Test Description',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBeUndefined();
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toBeDefined();
    });

    it('should return validation error for invalid date range', async () => {
      const invalidData = {
        name: 'Test Project',
        start_date: '2024-12-31',
        end_date: '2024-01-01', // Invalid: end date before start date
      };

      const request = new NextRequest('http://localhost:3000/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should handle database errors', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
      };

      mockPrisma.project.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });
});
