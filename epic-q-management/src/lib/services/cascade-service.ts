import { prisma } from '@/lib/database';

export interface CascadeResult {
  success: boolean;
  message: string;
  warnings?: string[];
  actions?: {
    type: 'unassign' | 'delete' | 'notify';
    description: string;
    data?: any;
  }[];
}

export class CascadeService {
  /**
   * Maneja la eliminación de un hospital con cascada inteligente
   */
  static async deleteHospitalWithCascade(hospitalId: string): Promise<CascadeResult> {
    const actions: any[] = [];
    const warnings: string[] = [];

    try {
      // 1. Obtener información del hospital y sus coordinadores
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId },
        include: {
          project_coordinators: {
            include: {
              users: true,
              projects: true
            }
          },
          project_hospitals: {
            include: {
              projects: true
            }
          }
        }
      });

      if (!hospital) {
        return {
          success: false,
          message: 'Hospital no encontrado'
        };
      }

      // 2. Verificar si hay proyectos activos
      const activeProjects = hospital.project_hospitals.filter(ph => ph.status === 'active');
      if (activeProjects.length > 0) {
        return {
          success: false,
          message: 'No se puede eliminar el hospital',
          warnings: [`El hospital está asociado a ${activeProjects.length} proyecto(s) activo(s). Primero debe ser removido de todos los proyectos.`]
        };
      }

      // 3. Analizar coordinadores asociados
      const coordinators = hospital.project_coordinators.filter(pc => pc.is_active);
      
      for (const coordinator of coordinators) {
        // Verificar si el coordinador está asignado a otros hospitales
        const otherHospitals = await prisma.project_coordinators.findMany({
          where: {
            user_id: coordinator.user_id,
            hospital_id: { not: hospitalId },
            is_active: true
          },
          include: {
            hospitals: true,
            projects: true
          }
        });

        if (otherHospitals.length === 0) {
          // El coordinador solo está asignado a este hospital
          actions.push({
            type: 'delete',
            description: `Eliminar coordinador ${coordinator.users.name} (${coordinator.users.email}) - solo asignado a este hospital`,
            data: {
              userId: coordinator.user_id,
              userName: coordinator.users.name,
              userEmail: coordinator.users.email
            }
          });
        } else {
          // El coordinador está asignado a otros hospitales
          actions.push({
            type: 'unassign',
            description: `Desasignar coordinador ${coordinator.users.name} de este hospital`,
            data: {
              userId: coordinator.user_id,
              userName: coordinator.users.name,
              userEmail: coordinator.users.email,
              otherHospitals: otherHospitals.map(oh => oh.hospitals.name)
            }
          });
        }
      }

      // 4. Verificar hospitales que quedarán sin coordinador
      const hospitalsWithoutCoordinators = await this.checkHospitalsWithoutCoordinators(hospitalId);
      if (hospitalsWithoutCoordinators.length > 0) {
        warnings.push(`Los siguientes hospitales quedarán sin coordinador: ${hospitalsWithoutCoordinators.join(', ')}`);
        actions.push({
          type: 'notify',
          description: 'Notificar al administrador sobre hospitales sin coordinador',
          data: {
            hospitals: hospitalsWithoutCoordinators
          }
        });
      }

      return {
        success: true,
        message: `Hospital "${hospital.name}" listo para eliminación`,
        warnings,
        actions
      };

    } catch (error) {
      console.error('Error en cascade service:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Ejecuta la eliminación del hospital con todas las acciones de cascada
   */
  static async executeHospitalDeletion(hospitalId: string, deleteCoordinators: boolean = false): Promise<CascadeResult> {
    try {
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId },
        include: {
          project_coordinators: {
            include: {
              users: true
            }
          }
        }
      });

      if (!hospital) {
        return {
          success: false,
          message: 'Hospital no encontrado'
        };
      }

      const actions: any[] = [];

      // Ejecutar eliminación en transacción
      await prisma.$transaction(async (tx) => {
        // 1. Eliminar relaciones de proyecto-hospital
        await tx.project_hospitals.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // 2. Manejar coordinadores
        const coordinators = hospital.project_coordinators.filter(pc => pc.is_active);
        
        for (const coordinator of coordinators) {
          // Verificar si el coordinador está asignado a otros hospitales
          const otherHospitals = await tx.project_coordinators.findMany({
            where: {
              user_id: coordinator.user_id,
              hospital_id: { not: hospitalId },
              is_active: true
            }
          });

          if (otherHospitals.length === 0) {
            // Solo está asignado a este hospital
            if (deleteCoordinators) {
              // Eliminar el usuario coordinador
              await tx.users.delete({
                where: { id: coordinator.user_id }
              });
              actions.push({
                type: 'delete',
                description: `Coordinador ${coordinator.users.name} eliminado`
              });
            } else {
              // Solo desasignar del hospital
              await tx.project_coordinators.updateMany({
                where: {
                  user_id: coordinator.user_id,
                  hospital_id: hospitalId
                },
                data: { is_active: false }
              });
              actions.push({
                type: 'unassign',
                description: `Coordinador ${coordinator.users.name} desasignado del hospital`
              });
            }
          } else {
            // Está asignado a otros hospitales, solo desasignar
            await tx.project_coordinators.updateMany({
              where: {
                user_id: coordinator.user_id,
                hospital_id: hospitalId
              },
              data: { is_active: false }
            });
            actions.push({
              type: 'unassign',
              description: `Coordinador ${coordinator.users.name} desasignado del hospital`
            });
          }
        }

        // 3. Eliminar datos relacionados del hospital
        await tx.hospital_contacts.deleteMany({
          where: { hospital_id: hospitalId }
        });

        await tx.hospital_details.deleteMany({
          where: { hospital_id: hospitalId }
        });

        await tx.hospital_progress.deleteMany({
          where: { 
            hospital_id: hospitalId
          }
        });

        await tx.recruitment_periods.deleteMany({
          where: { 
            project_hospitals: {
              hospital_id: hospitalId
            }
          }
        });

        await tx.case_metrics.deleteMany({
          where: { hospital_id: hospitalId }
        });

        await tx.alerts.deleteMany({
          where: { hospital_id: hospitalId }
        });

        await tx.communications.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // 4. Eliminar el hospital
        await tx.hospitals.delete({
          where: { id: hospitalId }
        });
      });

      return {
        success: true,
        message: `Hospital "${hospital.name}" eliminado exitosamente`,
        actions
      };

    } catch (error) {
      console.error('Error ejecutando eliminación de hospital:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Maneja la eliminación de un coordinador con cascada
   */
  static async deleteCoordinatorWithCascade(userId: string): Promise<CascadeResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          project_coordinators: {
            include: {
              hospitals: true,
              projects: true
            }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const actions: any[] = [];
      const warnings: string[] = [];

      // Verificar hospitales que quedarán sin coordinador
      const hospitalsWithoutCoordinators = await this.checkHospitalsWithoutCoordinatorsAfterUserDeletion(userId);
      if (hospitalsWithoutCoordinators.length > 0) {
        warnings.push(`Los siguientes hospitales quedarán sin coordinador: ${hospitalsWithoutCoordinators.join(', ')}`);
        actions.push({
          type: 'notify',
          description: 'Notificar al administrador sobre hospitales sin coordinador',
          data: {
            hospitals: hospitalsWithoutCoordinators
          }
        });
      }

      // Desasignar de todos los hospitales
      for (const coordinator of user.project_coordinators) {
        if (coordinator.is_active) {
          actions.push({
            type: 'unassign',
            description: `Desasignar de hospital ${coordinator.hospitals.name} en proyecto ${coordinator.projects.name}`,
            data: {
              hospitalId: coordinator.hospital_id,
              hospitalName: coordinator.hospitals.name,
              projectId: coordinator.project_id,
              projectName: coordinator.projects.name
            }
          });
        }
      }

      return {
        success: true,
        message: `Coordinador "${user.name}" listo para eliminación`,
        warnings,
        actions
      };

    } catch (error) {
      console.error('Error en cascade service para coordinador:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Ejecuta la eliminación del coordinador con todas las acciones de cascada
   */
  static async executeCoordinatorDeletion(userId: string): Promise<CascadeResult> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          project_coordinators: {
            include: {
              hospitals: true,
              projects: true
            }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const actions: any[] = [];

      // Ejecutar eliminación en transacción
      await prisma.$transaction(async (tx) => {
        // 1. Desasignar de todos los hospitales
        await tx.project_coordinators.updateMany({
          where: {
            user_id: userId,
            is_active: true
          },
          data: { is_active: false }
        });

        actions.push({
          type: 'unassign',
          description: `Coordinador desasignado de ${user.project_coordinators.length} hospital(es)`
        });

        // 2. Eliminar el usuario
        await tx.users.delete({
          where: { id: userId }
        });

        actions.push({
          type: 'delete',
          description: `Usuario ${user.name} eliminado`
        });
      });

      return {
        success: true,
        message: `Coordinador "${user.name}" eliminado exitosamente`,
        actions
      };

    } catch (error) {
      console.error('Error ejecutando eliminación de coordinador:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Verifica qué hospitales quedarán sin coordinador después de eliminar un hospital
   */
  private static async checkHospitalsWithoutCoordinators(hospitalId: string): Promise<string[]> {
    const hospital = await prisma.hospitals.findUnique({
      where: { id: hospitalId },
      include: {
        project_coordinators: {
          where: { is_active: true },
          include: {
            hospitals: true
          }
        }
      }
    });

    if (!hospital) return [];

    const hospitalsWithoutCoordinators: string[] = [];

    for (const coordinator of hospital.project_coordinators) {
        const otherCoordinators = await prisma.project_coordinators.findMany({
        where: {
          hospital_id: coordinator.hospital_id,
          user_id: { not: coordinator.user_id },
          is_active: true
        }
      });

      if (otherCoordinators.length === 0) {
        hospitalsWithoutCoordinators.push(coordinator.hospitals.name);
      }
    }

    return hospitalsWithoutCoordinators;
  }

  /**
   * Verifica qué hospitales quedarán sin coordinador después de eliminar un usuario
   */
  private static async checkHospitalsWithoutCoordinatorsAfterUserDeletion(userId: string): Promise<string[]> {
    const user = await prisma.userss.findUnique({
      where: { id: userId },
      include: {
        project_coordinators: {
          where: { is_active: true },
          include: {
            hospitals: true
          }
        }
      }
    });

    if (!user) return [];

    const hospitalsWithoutCoordinators: string[] = [];

    for (const coordinator of user.project_coordinators) {
        const otherCoordinators = await prisma.project_coordinators.findMany({
        where: {
          hospital_id: coordinator.hospital_id,
          user_id: { not: userId },
          is_active: true
        }
      });

      if (otherCoordinators.length === 0) {
        hospitalsWithoutCoordinators.push(coordinator.hospitals.name);
      }
    }

    return hospitalsWithoutCoordinators;
  }
}
