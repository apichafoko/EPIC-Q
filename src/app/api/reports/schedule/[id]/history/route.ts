import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { ScheduledReportService } from '@/lib/services/scheduled-report-service';
import { handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (req.method === 'GET') {
      const history = await ScheduledReportService.getReportHistory(id, limit);

      return NextResponse.json({
        success: true,
        data: history,
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
      resource: 'scheduled-reports',
      action: 'get-history',
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req, ctx) => handler(req, ctx, { params }))(
    request
  );
}


