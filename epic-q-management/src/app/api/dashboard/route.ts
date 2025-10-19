import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [kpis, hospitalsByStatus, alertsByType, recentAlerts, upcomingRecruitment] = await Promise.all([
      DashboardService.getDashboardKPIs(),
      DashboardService.getHospitalsByStatus(),
      DashboardService.getAlertsByType(),
      DashboardService.getRecentAlerts(5),
      DashboardService.getUpcomingRecruitment(5)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        hospitalsByStatus,
        alertsByType,
        recentAlerts,
        upcomingRecruitment
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
