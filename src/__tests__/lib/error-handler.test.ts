import { errorHandler, ContextualError, handleApiError } from '@/lib/error-handler';
import { createMockRequest } from '../helpers/mock-request';

// Mock de AuditService
jest.mock('@/lib/audit-service', () => ({
  AuditService: {
    logAction: jest.fn(),
    extractRequestInfo: jest.fn(() => ({
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler.clearLogs();
  });

  describe('captureError', () => {
    it('should capture an error and create audit log', async () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user-1',
        userName: 'Test User',
        resource: 'test-resource',
        action: 'test-action',
      };

      await errorHandler.captureError(error, context);

      const logs = errorHandler.getLogs('error');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].context).toEqual(context);
    });

    it('should handle errors when creating audit log fails', async () => {
      const { AuditService } = require('@/lib/audit-service');
      AuditService.logAction.mockRejectedValue(new Error('Audit error'));

      const error = new Error('Test error');
      await errorHandler.captureError(error);

      // Should not throw, error should be handled gracefully
      const logs = errorHandler.getLogs('error');
      expect(logs).toHaveLength(1);
    });
  });

  describe('captureWarning', () => {
    it('should capture a warning', async () => {
      await errorHandler.captureWarning('Test warning', {
        userId: 'user-1',
        resource: 'test-resource',
      });

      const logs = errorHandler.getLogs('warn');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test warning');
    });
  });

  describe('captureInfo', () => {
    it('should capture info message', async () => {
      await errorHandler.captureInfo('Test info', {
        userId: 'user-1',
      });

      const logs = errorHandler.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test info');
    });
  });

  describe('getErrorStatistics', () => {
    it('should return error statistics', async () => {
      await errorHandler.captureError(new Error('Error 1'));
      await errorHandler.captureError(new Error('Error 2'));
      await errorHandler.captureWarning('Warning 1');
      await errorHandler.captureInfo('Info 1');

      const stats = errorHandler.getErrorStatistics();

      expect(stats.total).toBe(4);
      expect(stats.byLevel.error).toBe(2);
      expect(stats.byLevel.warn).toBe(1);
      expect(stats.byLevel.info).toBe(1);
      expect(stats.recentErrors).toHaveLength(2);
    });
  });

  describe('formatLog', () => {
    it('should format log as JSON', () => {
      const log = {
        level: 'error' as const,
        message: 'Test error',
        error: new Error('Test error'),
        context: { userId: 'user-1' },
        timestamp: new Date(),
      };

      const formatted = errorHandler.formatLog(log);
      const parsed = JSON.parse(formatted);

      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Test error');
      expect(parsed.context).toEqual({ userId: 'user-1' });
    });
  });
});

describe('ContextualError', () => {
  it('should create error with context', () => {
    const context = {
      userId: 'user-1',
      resource: 'test-resource',
    };

    const error = new ContextualError('Test error', context, 400);

    expect(error.message).toBe('Test error');
    expect(error.context).toEqual(context);
    expect(error.statusCode).toBe(400);
  });
});

describe('handleApiError', () => {
  it('should handle error and return JSON response', async () => {
    const error = new Error('Test error');
    const request = createMockRequest('http://example.com');

    const response = await handleApiError(error, request as any, {
      userId: 'user-1',
      resource: 'test',
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Test error');
  });

  it('should handle ContextualError with status code', async () => {
    const error = new ContextualError('Not found', undefined, 404);
    const request = createMockRequest('http://example.com');

    const response = await handleApiError(error, request as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Not found');
  });
});

