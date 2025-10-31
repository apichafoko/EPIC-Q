import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { AuditService } from '@/lib/audit-service';
import { handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Parámetros de filtrado (opcionales)
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

    if (format === 'csv') {
      const csv = await AuditService.exportToCSV({
        userId,
        resource,
        resourceId,
        action,
        status,
        startDate,
        endDate,
        search,
      });

      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Format ${format} not supported. Use 'csv'` },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'audit',
      action: 'export-logs',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(handler)(request);
}


