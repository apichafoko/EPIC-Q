import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '../../../../../../../lib/database';

// Mock de Prisma
jest.mock('@/lib/database', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    hospital: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    projectHospital: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    projectCoordinator: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock de middleware de autenticación
jest.mock('@/lib/auth/middleware', () => ({
  withAdminAuth: (handler: any) => handler,
}));

// Mock del servicio de email
jest.mock('@/lib/notifications/project-invitation-service', () => ({
  projectInvitationService: {
    sendProjectInvitation: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/admin/projects/[id]/invite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      description: 'Test Description',
    };

    const mockHospital = {
      id: 'hospital-1',
      name: 'Test Hospital',
      province: 'Test Province',
      city: 'Test City',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'coordinator',
    };

    it('should invite a new coordinator successfully', async () => {
      const invitationData = {
        email: 'newcoordinator@hospital.com',
        name: 'New Coordinator',
        hospital_id: 'hospital-1',
        required_periods: 3,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.hospital.findUnique.mockResolvedValue(mockHospital);
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrisma.projectHospital.findFirst.mockResolvedValue(null); // Hospital not in project
      mockPrisma.projectCoordinator.findFirst.mockResolvedValue(null); // No existing coordinator
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: invitationData.email,
        name: invitationData.name,
      });
      mockPrisma.projectHospital.create.mockResolvedValue({
        id: 'ph-1',
        project_id: 'project-1',
        hospital_id: 'hospital-1',
        required_periods: 3,
        joined_at: new Date(),
        status: 'active',
      });
      mockPrisma.projectCoordinator.create.mockResolvedValue({
        id: 'pc-1',
        project_id: 'project-1',
        user_id: 'user-1',
        hospital_id: 'hospital-1',
        role: 'coordinator',
        invited_at: new Date(),
        invitation_token: 'test-token',
        is_active: false,
        project: mockProject,
        user: mockUser,
        hospital: mockHospital,
      });

      const { projectInvitationService } = require('@/lib/notifications/project-invitation-service');
      projectInvitationService.sendProjectInvitation.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.projectCoordinator.create).toHaveBeenCalled();
      expect(projectInvitationService.sendProjectInvitation).toHaveBeenCalled();
    });

    it('should invite an existing user as coordinator', async () => {
      const invitationData = {
        email: 'existing@hospital.com',
        name: 'Existing User',
        hospital_id: 'hospital-1',
        required_periods: 2,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.hospital.findUnique.mockResolvedValue(mockHospital);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser); // User exists
      mockPrisma.projectHospital.findFirst.mockResolvedValue(null);
      mockPrisma.projectCoordinator.findFirst.mockResolvedValue(null);
      mockPrisma.projectHospital.create.mockResolvedValue({
        id: 'ph-1',
        project_id: 'project-1',
        hospital_id: 'hospital-1',
        required_periods: 2,
        joined_at: new Date(),
        status: 'active',
      });
      mockPrisma.projectCoordinator.create.mockResolvedValue({
        id: 'pc-1',
        project_id: 'project-1',
        user_id: 'user-1',
        hospital_id: 'hospital-1',
        role: 'coordinator',
        invited_at: new Date(),
        invitation_token: 'test-token',
        is_active: false,
        project: mockProject,
        user: mockUser,
        hospital: mockHospital,
      });

      const { projectInvitationService } = require('@/lib/notifications/project-invitation-service');
      projectInvitationService.sendProjectInvitation.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.user.create).not.toHaveBeenCalled(); // Should not create new user
      expect(mockPrisma.projectCoordinator.create).toHaveBeenCalled();
    });

    it('should return error if project not found', async () => {
      const invitationData = {
        email: 'test@hospital.com',
        name: 'Test User',
        hospital_id: 'hospital-1',
        required_periods: 2,
      };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Proyecto no encontrado');
    });

    it('should return error if hospital not found', async () => {
      const invitationData = {
        email: 'test@hospital.com',
        name: 'Test User',
        hospital_id: 'hospital-1',
        required_periods: 2,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.hospital.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Hospital no encontrado');
    });

    it('should return error if hospital already in project', async () => {
      const invitationData = {
        email: 'test@hospital.com',
        name: 'Test User',
        hospital_id: 'hospital-1',
        required_periods: 2,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.hospital.findUnique.mockResolvedValue(mockHospital);
      mockPrisma.projectHospital.findFirst.mockResolvedValue({
        id: 'ph-1',
        project_id: 'project-1',
        hospital_id: 'hospital-1',
        required_periods: 2,
        joined_at: new Date(),
        status: 'active',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Este hospital ya está participando en el proyecto');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid email format
        name: '', // Empty name
        hospital_id: 'invalid-uuid',
        required_periods: 0, // Invalid: must be >= 1
      };

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toBeDefined();
    });

    it('should handle email sending failure gracefully', async () => {
      const invitationData = {
        email: 'test@hospital.com',
        name: 'Test User',
        hospital_id: 'hospital-1',
        required_periods: 2,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.hospital.findUnique.mockResolvedValue(mockHospital);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.projectHospital.findFirst.mockResolvedValue(null);
      mockPrisma.projectCoordinator.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.projectHospital.create.mockResolvedValue({
        id: 'ph-1',
        project_id: 'project-1',
        hospital_id: 'hospital-1',
        required_periods: 2,
        joined_at: new Date(),
        status: 'active',
      });
      mockPrisma.projectCoordinator.create.mockResolvedValue({
        id: 'pc-1',
        project_id: 'project-1',
        user_id: 'user-1',
        hospital_id: 'hospital-1',
        role: 'coordinator',
        invited_at: new Date(),
        invitation_token: 'test-token',
        is_active: false,
        project: mockProject,
        user: mockUser,
        hospital: mockHospital,
      });

      const { projectInvitationService } = require('@/lib/notifications/project-invitation-service');
      projectInvitationService.sendProjectInvitation.mockResolvedValue(false); // Email failed

      const request = new NextRequest('http://localhost:3000/api/admin/projects/project-1/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const response = await POST(request, {} as any, { params: Promise.resolve({ id: 'project-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(false);
      expect(data.message).toContain('el email no pudo ser enviado');
    });
  });
});
