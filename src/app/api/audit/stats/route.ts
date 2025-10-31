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

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const statistics = await AuditService.getStatistics(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'audit',
      action: 'get-stats',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


