import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { AuditService } from '@/lib/audit-service';
import { errorHandler, handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    // Parámetros de filtrado
    const userId = searchParams.get('userId') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const action = searchParams.get('action') || undefined;
    const status = searchParams.get('status') as 'success' | 'error' | 'warning' | undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const search = searchParams.get('search') || undefined;

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await AuditService.getLogs(
      {
        userId,
        resource,
        resourceId,
        action,
        status,
        startDate,
        endDate,
        search,
      },
      { page, limit }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'audit',
      action: 'get-logs',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


