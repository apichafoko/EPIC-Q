'use client';

import { ChevronRight, Home, MapPin } from 'lucide-react';
import { Button } from './button';
import { useTranslations } from 'next-intl';

interface GeographicBreadcrumbProps {
  province?: string;
  city?: string;
  onBack?: () => void;
  onProvinceClick?: () => void;
}

export function GeographicBreadcrumb({
  province,
  city,
  onBack,
  onProvinceClick,
}: GeographicBreadcrumbProps) {
  const t = useTranslations();

  const items = [
    {
      label: t('geographic.breadcrumb.argentina'),
      icon: Home,
      onClick: onBack,
    },
  ];

  if (province) {
    items.push({
      label: province,
      icon: MapPin,
      onClick: onProvinceClick || onBack,
    });
  }

  if (city) {
    items.push({
      label: city,
      icon: MapPin,
      onClick: undefined,
    });
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className={`h-auto p-0 font-normal ${
                isLast ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={item.onClick}
              disabled={!item.onClick || isLast}
            >
              <Icon className="h-3 w-3 mr-1" />
              {item.label}
            </Button>
          </div>
        );
      })}
    </nav>
  );
}

