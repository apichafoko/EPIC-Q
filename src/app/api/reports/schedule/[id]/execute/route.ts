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

    if (req.method === 'POST') {
      const result = await ScheduledReportService.executeReport(id);

      return NextResponse.json({
        success: result.success,
        data: result,
        ...(result.error && { error: result.error }),
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
      action: 'execute',
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req, ctx) => handler(req, ctx, { params }))(
    request
  );
}


