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

    if (req.method === 'GET') {
      const report = await ScheduledReportService.getReportById(id);
      
      if (!report) {
        return NextResponse.json(
          { error: 'Reporte no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json();
      const report = await ScheduledReportService.updateReport(id, body);

      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    if (req.method === 'DELETE') {
      await ScheduledReportService.deleteReport(id);

      return NextResponse.json({
        success: true,
        message: 'Reporte eliminado',
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
      action: req.method.toLowerCase(),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req, ctx) => handler(req, ctx, { params }))(
    request
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req, ctx) => handler(req, ctx, { params }))(
    request
  );
}


