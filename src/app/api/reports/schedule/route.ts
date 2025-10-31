import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { ScheduledReportService } from '@/lib/services/scheduled-report-service';
import { handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const isActive = searchParams.get('isActive');
      
      const reports = await ScheduledReportService.getAllReports(
        isActive ? isActive === 'true' : undefined
      );

      return NextResponse.json({
        success: true,
        data: reports,
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const {
        name,
        description,
        reportType,
        frequency,
        format,
        recipients,
        filters,
        templateId,
      } = body;

      if (!name || !reportType || !frequency || !format || !recipients) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      const report = await ScheduledReportService.createReport(
        {
          name,
          description,
          reportType,
          frequency,
          format,
          recipients,
          filters,
          templateId,
        },
        context.user.id
      );

      return NextResponse.json({
        success: true,
        data: report,
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
      action: req.method === 'GET' ? 'list' : 'create',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}

export async function POST(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


