'use server';

import { prisma } from '@/lib/database';

export async function getExecutiveSummary() {
  const [
    totalHospitals,
    activeHospitals,
    totalCases,
    averageCompletion,
    activeAlerts,
    recentCommunications
  ] = await Promise.all([
    prisma.hospital.count(),
    prisma.hospital.count({ where: { status: 'active_recruiting' } }),
    prisma.caseMetric.aggregate({ _sum: { cases_created: true } }).then(res => res._sum.cases_created || 0),
    prisma.hospitalProgress.aggregate({ _avg: { progress_percentage: true } }).then(res => Math.round(res._avg.progress_percentage || 0)),
    prisma.alert.count({ where: { is_resolved: false } }),
    prisma.communication.count({ where: { created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
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
  const statusCounts = await prisma.hospital.groupBy({
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
  const provinceCounts = await prisma.hospital.groupBy({
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
  const progressData = await prisma.hospitalProgress.findMany({
    include: {
      hospital: {
        select: { name: true, province: true }
      }
    }
  });

  return progressData.map(item => ({
    hospitalName: item.hospital?.name || 'Unknown',
    province: item.hospital?.province || 'Unknown',
    progressPercentage: item.progress_percentage || 0,
    ethicsSubmitted: item.ethics_submitted || false,
    ethicsApproved: item.ethics_approved || false,
    readyForRecruitment: item.ready_for_recruitment || false
  }));
}

export async function getCaseMetricsReport() {
  const caseMetrics = await prisma.caseMetric.findMany({
    include: {
      hospital: {
        select: { name: true, province: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return caseMetrics.map(item => ({
    hospitalName: item.hospital?.name || 'Unknown',
    province: item.hospital?.province || 'Unknown',
    casesCreated: item.cases_created || 0,
    completionPercentage: item.completion_percentage || 0,
    date: item.created_at
  }));
}

export async function getCommunicationReport() {
  const communications = await prisma.communication.findMany({
    include: {
      hospital: {
        select: { name: true, province: true }
      },
      user: {
        select: { name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return communications.map(item => ({
    id: item.id,
    hospitalName: item.hospital?.name || 'Unknown',
    province: item.hospital?.province || 'Unknown',
    type: item.type,
    subject: item.subject,
    sentBy: item.user?.name || 'Unknown',
    sentAt: item.created_at,
    status: item.status || 'sent'
  }));
}

export async function getAlertReport() {
  const alerts = await prisma.alert.findMany({
    include: {
      hospital: {
        select: { name: true, province: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return alerts.map(item => ({
    id: item.id,
    hospitalName: item.hospital?.name || 'Unknown',
    province: item.hospital?.province || 'Unknown',
    title: item.title,
    message: item.message,
    severity: item.severity,
    isResolved: item.is_resolved,
    createdAt: item.created_at,
    resolvedAt: item.resolved_at
  }));
}
