import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/middleware';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { handleApiError } from '@/lib/error-handler';
import prisma from '@/lib/db-connection';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const metric = searchParams.get('metric');

      if (!metric) {
        return NextResponse.json(
          { error: 'Parámetro "metric" es requerido' },
          { status: 400 }
        );
      }

      let projectId = searchParams.get('projectId') || undefined;
      let hospitalId = searchParams.get('hospitalId') || undefined;
      const province = searchParams.get('province') || undefined;
      const city = searchParams.get('city') || undefined;
      const groupBy = searchParams.get('groupBy') as 'province' | 'city' | undefined;
      const dateFrom = searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined;
      const dateTo = searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined;

      // Para coordinadores, filtrar por sus proyectos asignados
      if (context.user.role === 'coordinator') {
        const userProjects = await prisma.project_coordinators.findMany({
          where: {
            user_id: context.user.id,
            is_active: true,
          },
          select: {
            project_id: true,
            hospital_id: true,
          },
        });

        if (userProjects.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            metric,
          });
        }

        // Si hay projectId especificado, verificar que el coordinador tenga acceso
        if (projectId) {
          const hasAccess = userProjects.some((up) => up.project_id === projectId);
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'No tienes acceso a este proyecto' },
              { status: 403 }
            );
          }
        } else {
          // Si no hay projectId, usar el primer proyecto asignado (o todos)
          projectId = userProjects[0]?.project_id;
        }

        // Filtrar hospitalId si se especifica
        if (hospitalId) {
          const hasAccess = userProjects.some(
            (up) => up.project_id === projectId && up.hospital_id === hospitalId
          );
          if (!hasAccess) {
            hospitalId = undefined; // No tiene acceso, ignorar filtro
          }
        }
      }

      const filters = {
        projectId,
        hospitalId,
        province,
        city,
        dateFrom,
        dateTo,
      };

      let data;

      switch (metric) {
        case 'case_trends':
          data = await AnalyticsService.getCaseTrends(filters);
          break;
        case 'completion_trends':
          data = await AnalyticsService.getCompletionTrends(filters);
          break;
        case 'activity_heatmap':
          data = await AnalyticsService.getActivityHeatmap(filters);
          break;
        case 'bubble_chart':
          data = await AnalyticsService.getBubbleChartData(filters);
          break;
        case 'coordinator_performance':
          data = await AnalyticsService.getCoordinatorPerformance(filters);
          break;
        case 'predictions': {
          const predictionType = searchParams.get('predictionType') || 'cases';
          const predictionDays = parseInt(searchParams.get('days') || '30', 10);
          data = await AnalyticsService.getPredictions(
            predictionType as 'cases' | 'completion',
            predictionDays
          );
          break;
        }
        case 'geographic_distribution': {
          const distributionType = searchParams.get('distributionType') || 'cases';
          data = await AnalyticsService.getGeographicDistribution(
            distributionType as 'cases' | 'progress' | 'alerts'
          );
          break;
        }
        case 'hospital_progress':
          data = await AnalyticsService.getHospitalProgress(
            projectId,
            filters
          );
          break;
        case 'recruitment_velocity': {
          const granularity = searchParams.get('granularity') || 'day';
          data = await AnalyticsService.getRecruitmentVelocity(projectId, {
            ...filters,
            granularity: granularity as 'day' | 'week' | 'month',
          });
          break;
        }
        case 'province_comparison': {
          const groupByParam = groupBy || (searchParams.get('groupBy') as 'province' | 'city' | undefined);
          data = await AnalyticsService.getProvinceComparison(projectId, {
            ...filters,
            groupBy: groupByParam,
          });
          break;
        }
        case 'city_comparison': {
          if (!projectId || !province) {
            return NextResponse.json(
              { error: 'Parámetros "projectId" y "province" son requeridos para city_comparison' },
              { status: 400 }
            );
          }
          data = await AnalyticsService.getCityComparison(projectId, province, filters);
          break;
        }
        case 'cities_by_province': {
          const provinceParam = searchParams.get('province');
          if (!provinceParam) {
            return NextResponse.json(
              { error: 'Parámetro "province" es requerido para cities_by_province' },
              { status: 400 }
            );
          }
          data = await AnalyticsService.getCitiesByProvince(provinceParam, projectId);
          break;
        }
        case 'completion_prediction': {
          const level = searchParams.get('level') || 'global';
          const predictionDays = parseInt(searchParams.get('days') || '90', 10);
          data = await AnalyticsService.getCompletionPrediction(projectId, {
            ...filters,
            level: level as 'hospital' | 'province' | 'global',
            days: predictionDays,
          });
          break;
        }
        default:
          return NextResponse.json(
            { error: `Métrica no soportada: ${metric}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        data,
        metric,
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
      resource: 'analytics',
      action: 'get',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(handler)(request);
}


