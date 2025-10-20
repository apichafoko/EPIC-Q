'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { Logo } from '@/components/ui/logo';
import { useProject } from '@/contexts/project-context';
import {
  BarChart3,
  Building2,
  Mail,
  FileText,
  Calendar,
  Users,
  Settings,
  Bell,
  UserPlus,
  CheckCircle,
  Download,
  X
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface CoordinatorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function CoordinatorSidebar({ isOpen = true, onClose, isMobile = false }: CoordinatorSidebarProps) {
  const { t, locale } = useTranslations();
  const pathname = usePathname();
  const { currentProject } = useProject();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [progressStatus, setProgressStatus] = useState({
    ethicsSubmitted: false,
    ethicsApproved: false,
    recruitmentPeriods: 0,
    requiredPeriods: 2
  });

  // Cargar estado de progreso
  useEffect(() => {
    const loadProgressStatus = async () => {
      if (!currentProject?.id) return;

      try {
        const response = await fetch(`/api/coordinator/stats?projectId=${currentProject.id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.hospital && data.data.hospital.progress) {
            const progress = data.data.hospital.progress;
            setProgressStatus({
              ethicsSubmitted: progress.ethics_submitted || false,
              ethicsApproved: progress.ethics_approved || false,
              recruitmentPeriods: data.data.recruitmentPeriods?.length || 0,
              requiredPeriods: data.data.hospital.required_periods || 2
            });
          }
        }
      } catch (error) {
        console.error('Error loading progress status:', error);
      }
    };

    loadProgressStatus();
  }, [currentProject?.id]);

  // Determinar el estado de completitud de cada sección
  const getCompletionStatus = () => {
    if (!currentProject?.coordinatorInfo?.hospital) {
      return {
        hospitalForm: false,
        progress: false
      };
    }

    const hospital = currentProject.coordinatorInfo.hospital;
    const hospitalDetails = hospital.hospital_details;
    
    // Verificar si el formulario del hospital está completo
    const hospitalFormComplete = !!(
      hospitalDetails?.num_beds &&
      hospitalDetails?.num_operating_rooms &&
      hospitalDetails?.num_icu_beds &&
      hospitalDetails?.avg_weekly_surgeries &&
      hospitalDetails?.financing_type &&
      hospitalDetails?.has_preop_clinic &&
      hospital.lasos_participation !== null &&
      hospital.hospital_contacts?.[0]?.name &&
      hospital.hospital_contacts?.[0]?.email &&
      hospital.hospital_contacts?.[0]?.phone &&
      hospital.hospital_contacts?.[0]?.specialty
    );

    // Verificar si la ética y períodos están completos
    const progressComplete = !!(
      progressStatus.ethicsSubmitted &&
      progressStatus.ethicsApproved &&
      progressStatus.recruitmentPeriods >= progressStatus.requiredPeriods
    );

    return {
      hospitalForm: hospitalFormComplete,
      progress: progressComplete
    };
  };

  const completionStatus = getCompletionStatus();

  const navigation = [
    { 
      name: t('common.dashboard'), 
      href: `/${locale}/coordinator`, 
      icon: BarChart3,
      isComplete: false // Dashboard no tiene estado de completitud
    },
    // PWA Install item - solo mostrar si se puede instalar y no está instalada
    ...(canInstall && !isInstalled ? [{
      name: t('sidebar.installApp'),
      href: '#',
      icon: Download,
      isComplete: false,
      onClick: promptInstall,
      isPWAInstall: true
    }] : []),
    { 
      name: 'Invitaciones', 
      href: `/${locale}/coordinator/pending-invitations`, 
      icon: UserPlus,
      isComplete: false // Invitaciones no tienen estado de completitud
    },
    { 
      name: t('common.hospitalForm'), 
      href: `/${locale}/coordinator/hospital-form`, 
      icon: Building2,
      isComplete: completionStatus.hospitalForm
    },
    { 
      name: 'Ética y Períodos', 
      href: `/${locale}/coordinator/progress`, 
      icon: Calendar,
      isComplete: completionStatus.progress
    },
    { 
      name: t('common.communications'), 
      href: `/${locale}/coordinator/communications`, 
      icon: Mail,
      isComplete: false // Communications no tiene estado de completitud
    },
    { 
      name: t('common.notifications'), 
      href: `/${locale}/coordinator/notifications`, 
      icon: Bell,
      isComplete: false // Notifications no tiene estado de completitud
    },
    { 
      name: t('common.redcapUsers'), 
      href: `/${locale}/coordinator/redcap-users`, 
      icon: Users,
      isComplete: false // RedCap users no tiene estado de completitud
    },
    // Settings oculto para coordinadores (incluye privacidad de datos)
    // { 
    //   name: t('common.settings'), 
    //   href: `/${locale}/coordinator/settings`, 
    //   icon: Settings 
    // },
  ];

  // Cerrar sidebar automáticamente al navegar en móvil
  const handleNavigation = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col",
        // Desktop: Fixed sidebar
        "lg:w-64 lg:fixed lg:inset-y-0",
        // Mobile: Full-screen drawer
        isMobile && "fixed inset-0 z-50 w-full transition-transform duration-300",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Logo size="md" showText={false} />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">EPIC-Q</h1>
              <p className="text-xs text-gray-500">Coordinador</p>
            </div>
          </div>
          
          {/* Botón de cierre en móvil */}
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 touch-target"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isPWAInstall = (item as any).isPWAInstall;
          
          if (isPWAInstall) {
            return (
              <button
                key={item.name}
                onClick={() => {
                  item.onClick?.();
                  handleNavigation();
                }}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium w-full text-left touch-target',
                  'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center flex-1">
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                </div>
              </button>
            );
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavigation}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium touch-target',
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <div className="flex items-center flex-1">
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {item.isComplete && (
                  <CheckCircle 
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isActive ? 'text-green-200' : 'text-green-500'
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            </Link>
          );
        })}
        </nav>
      </aside>
    </>
  );
}
