'use server';

import { prisma } from '../../lib/database';

export async function getExecutiveSummary() {
  const [
    totalHospitals,
    activeHospitals,
    totalCases,
    averageCompletion,
    activeAlerts,
    recentCommunications
  ] = await Promise.all([
    prisma.hospitals.count(),
    prisma.hospitals.count({ where: { status: 'active_recruiting' } }),
    prisma.case_metrics.aggregate({ _sum: { cases_created: true } }).then(res => res._sum.cases_created || 0),
    prisma.hospital_progress.aggregate({ _avg: { progress_percentage: true } }).then(res => Math.round(res._avg.progress_percentage || 0)),
    prisma.alerts.count({ where: { is_resolved: false } }),
    prisma.communications.count({ where: { created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
  ]);

  return {
    totalHospitals,
    activeHospitals,
    totalCases,
    averageCompletion,
    activeAlerts,
    recentCommunications
  };
}

export async function getHospitalStatusReport() {
  const statusCounts = await prisma.hospitals.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  return statusCounts.map(item => ({
    status: item.status || 'unknown',
    count: item._count.status
  }));
}

export async function getProvinceDistribution() {
  const provinceCounts = await prisma.hospitals.groupBy({
    by: ['province'],
    _count: {
      province: true
    },
    orderBy: {
      _count: {
        province: 'desc'
      }
    }
  });

  return provinceCounts.map(item => ({
    province: item.province || 'unknown',
    count: item._count.province
  }));
}

export async function getProgressReport() {
  const progressData = await prisma.hospital_progress.findMany({
    include: {
      hospitals: {
        select: { name: true, province: true }
      }
    }
  });

  return progressData.map(item => ({
    hospitalName: item.hospitals?.name || 'Unknown',
    province: item.hospitals?.province || 'Unknown',
    progressPercentage: item.progress_percentage || 0,
    ethicsSubmitted: item.ethics_submitted || false,
    ethicsApproved: item.ethics_approved || false,
    readyForRecruitment: (item.ethics_approved && item.progress_percentage >= 100) || false
  }));
}

export async function getCaseMetricsReport() {
  const caseMetrics = await prisma.case_metrics.findMany({
    include: {
      hospitals: {
        select: { name: true, province: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return caseMetrics.map(item => ({
    hospitalName: item.hospitals?.name || 'Unknown',
    province: item.hospitals?.province || 'Unknown',
    casesCreated: item.cases_created || 0,
    completionPercentage: item.completion_percentage || 0,
    date: item.created_at
  }));
}

export async function getCommunicationReport() {
  const communications = await prisma.communications.findMany({
    include: {
      hospitals: {
        select: { name: true, province: true }
      },
      recipient: {
        select: { name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return communications.map(item => ({
    id: item.id,
    hospitalName: item.hospitals?.name || 'Unknown',
    province: item.hospitals?.province || 'Unknown',
    type: item.type,
    subject: item.subject,
    sentBy: item.recipient?.name || 'Unknown',
    sentAt: item.created_at,
    status: item.email_status || 'sent'
  }));
}

export async function getAlertReport() {
  const alerts = await prisma.alerts.findMany({
    include: {
      hospitals: {
        select: { name: true, province: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return alerts.map(item => ({
    id: item.id,
    hospitalName: item.hospitals?.name || 'Unknown',
    province: item.hospitals?.province || 'Unknown',
    title: item.title,
    message: item.message,
    severity: item.severity,
    isResolved: item.is_resolved,
    createdAt: item.created_at,
    resolvedAt: item.resolved_at
  }));
}
