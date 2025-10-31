import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { SecurityLogger } from '@/lib/security/security-logger';
import { handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      
      const type = searchParams.get('type') || undefined;
      const severity = searchParams.get('severity') || undefined;
      const userId = searchParams.get('userId') || undefined;
      const ipAddress = searchParams.get('ipAddress') || undefined;
      const dateFrom = searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined;
      const dateTo = searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined;
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const result = await SecurityLogger.getSecurityLogs(
        {
          type,
          severity,
          userId,
          ipAddress,
          dateFrom,
          dateTo,
        },
        limit,
        offset
      );

      return NextResponse.json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'security-logs',
      action: 'list',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


