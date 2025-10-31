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
      
      const dateFrom = searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined;
      const dateTo = searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined;

      const stats = await SecurityLogger.getSecurityStatistics(dateFrom, dateTo);

      return NextResponse.json({
        success: true,
        data: stats,
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
      resource: 'security-stats',
      action: 'get',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


