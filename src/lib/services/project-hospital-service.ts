'use server';

import { prisma } from '../../lib/database';
import { ProjectHospital } from '../../types';

export async function getProjectHospitalsByHospitalId(hospitalId: string) {
  try {
    const projectHospitals = await prisma.project_hospitals.findMany({
      where: {
        hospital_id: hospitalId
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true
          }
        },
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return projectHospitals;
  } catch (error) {
    console.error('Error fetching project hospitals:', error);
    throw error;
  }
}

export async function updateProjectHospitalRedcapId(projectHospitalId: string, redcapId: string) {
  try {
    const updated = await prisma.project_hospitals.update({
      where: {
        id: projectHospitalId
      },
      data: {
        redcap_id: redcapId
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating project hospital redcap_id:', error);
    throw error;
  }
}

export async function getProjectHospitalById(projectHospitalId: string) {
  try {
    const projectHospital = await prisma.project_hospitals.findUnique({
      where: {
        id: projectHospitalId
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true
          }
        },
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true
          }
        }
      }
    });

    return projectHospital;
  } catch (error) {
    console.error('Error fetching project hospital:', error);
    throw error;
  }
}
