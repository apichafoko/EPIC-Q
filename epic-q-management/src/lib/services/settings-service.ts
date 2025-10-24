'use server';

import { prisma } from '@/lib/database';

export async function getSystemSettings() {
  // This would typically come from a settings table
  // For now, return default values
  return {
    siteName: 'EPIC-Q Management System',
    siteDescription: 'Sistema de gestión para el estudio EPIC-Q',
    defaultLanguage: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    sessionTimeout: 3600, // 1 hour
    passwordMinLength: 8,
    requirePasswordComplexity: true,
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
  };
}

export async function updateSystemSettings(settings: any) {
  // This would typically update a settings table
  // For now, just return success
  console.log('Updating system settings:', settings);
  return { success: true };
}

export async function getNotificationSettings() {
  // This would typically come from user preferences
  return {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyDigest: true,
    monthlyReport: true,
    alertNotifications: true,
    communicationNotifications: true,
    progressNotifications: true,
  };
}

export async function updateNotificationSettings(settings: any) {
  // This would typically update user preferences
  console.log('Updating notification settings:', settings);
  return { success: true };
}

export async function getEmailTemplates() {
  const templates = await prisma.communication_templates.findMany({
    orderBy: { created_at: 'desc' }
  });

  return templates.map(template => ({
    id: template.id,
    name: template.name,
    subject: template.email_subject || '',
    content: template.email_body || '',
    variables: template.variables || [],
    isDefault: false,
    createdAt: template.created_at,
    updatedAt: template.updated_at
  }));
}

export async function createEmailTemplate(template: any) {
  const newTemplate = await prisma.communication_templates.create({
    data: {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      email_subject: template.subject,
      email_body: template.content,
      variables: template.variables || [],
      category: template.category || 'general',
      is_active: true,
      usage_count: 0
    }
  });

  return newTemplate;
}

export async function updateEmailTemplate(id: string, template: any) {
  const updatedTemplate = await prisma.communication_templates.update({
    where: { id },
    data: {
      name: template.name,
      email_subject: template.subject,
      email_body: template.content,
      variables: template.variables || [],
      category: template.category || 'general',
      updated_at: new Date(),
    }
  });

  return updatedTemplate;
}

export async function deleteEmailTemplate(id: string) {
  await prisma.communication_templates.delete({
    where: { id }
  });

  return { success: true };
}
