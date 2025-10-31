import { AuditService } from '@/lib/audit-service';
import { prisma } from '@/lib/database';

// Mock de Prisma
jest.mock('@/lib/database', () => ({
  prisma: {
    audit_logs: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('should create an audit log successfully', async () => {
      const mockAuditLog = {
        id: 'test-id',
        user_id: 'user-1',
        user_name: 'Test User',
        action: 'create',
        resource: 'hospitals',
        resource_id: 'hospital-1',
        details: { test: 'data' },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
        status: 'success',
        error_message: null,
        metadata: null,
        created_at: new Date(),
      };

      (prisma.audit_logs.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logAction(
        'user-1',
        'Test User',
        'create',
        'hospitals',
        'hospital-1',
        { test: 'data' },
        '127.0.0.1',
        'test-agent',
        'success'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.action).toBe('create');
      expect(result.resource).toBe('hospitals');
      expect(prisma.audit_logs.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-1',
          user_name: 'Test User',
          action: 'create',
          resource: 'hospitals',
          resource_id: 'hospital-1',
          details: { test: 'data' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          status: 'success',
          error_message: null,
          metadata: null,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      (prisma.audit_logs.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await AuditService.logAction(
        'user-1',
        'Test User',
        'create',
        'hospitals'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('error');
      expect(result.errorMessage).toBeDefined();
    });
  });

  describe('getLogs', () => {
    it('should return paginated logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-1',
          user_name: 'Test User',
          action: 'create',
          resource: 'hospitals',
          resource_id: 'hospital-1',
          details: null,
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          status: 'success',
          error_message: null,
          metadata: null,
          created_at: new Date(),
        },
      ];

      (prisma.audit_logs.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.audit_logs.count as jest.Mock).mockResolvedValue(1);

      const result = await AuditService.getLogs({}, { page: 1, limit: 50 });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(1);
    });

    it('should filter logs by userId', async () => {
      (prisma.audit_logs.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.audit_logs.count as jest.Mock).mockResolvedValue(0);

      await AuditService.getLogs({ userId: 'user-1' });

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-1',
          }),
        })
      );
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.audit_logs.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.audit_logs.count as jest.Mock).mockResolvedValue(0);

      await AuditService.getLogs({ startDate, endDate });

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });

  describe('extractRequestInfo', () => {
    it('should extract IP address from x-forwarded-for header', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const info = AuditService.extractRequestInfo(request);

      expect(info.ipAddress).toBe('192.168.1.1');
    });

    it('should extract user agent', () => {
      const request = new Request('http://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      const info = AuditService.extractRequestInfo(request);

      expect(info.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const mockStats = {
        total: 100,
        byAction: { create: 50, update: 30, delete: 20 },
        byResource: { hospitals: 60, projects: 40 },
        byStatus: { success: 90, error: 10 },
        errors: 10,
        topUsers: [
          { userId: 'user-1', userName: 'User 1', count: 50 },
          { userId: 'user-2', userName: 'User 2', count: 30 },
        ],
      };

      (prisma.audit_logs.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10); // errors

      (prisma.audit_logs.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { action: 'create', _count: { action: 50 } },
          { action: 'update', _count: { action: 30 } },
        ]) // byAction
        .mockResolvedValueOnce([
          { resource: 'hospitals', _count: { resource: 60 } },
          { resource: 'projects', _count: { resource: 40 } },
        ]) // byResource
        .mockResolvedValueOnce([
          { status: 'success', _count: { status: 90 } },
          { status: 'error', _count: { status: 10 } },
        ]) // byStatus
        .mockResolvedValueOnce([
          { user_id: 'user-1', user_name: 'User 1', _count: { user_id: 50 } },
          { user_id: 'user-2', user_name: 'User 2', _count: { user_id: 30 } },
        ]); // topUsers

      const result = await (await import('@/lib/audit-service')).AuditService.getStatistics();

      expect(result.total).toBe(mockStats.total);
      expect(result.errors).toBe(mockStats.errors);
      expect(result.byAction.create).toBe(50);
      expect(result.byResource.hospitals).toBe(60);
      expect(result.byStatus.success).toBe(90);
      expect(result.topUsers.length).toBe(2);
    });
  });
});

