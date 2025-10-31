'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun, Contrast, Type } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useTranslations } from '../../hooks/useTranslations';
import { cn } from '../../lib/utils';

type Theme = 'light' | 'dark' | 'high-contrast' | 'system';
type FontSize = 'small' | 'medium' | 'large';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [fontSize, setFontSize] = useState<FontSize>('medium');

  useEffect(() => {
    if (mounted) {
      // Cargar preferencias del usuario desde localStorage
      const savedFontSize = localStorage.getItem('fontSize') as FontSize;
      if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
        setFontSize(savedFontSize);
        document.documentElement.setAttribute('data-font-size', savedFontSize);
      } else {
        document.documentElement.setAttribute('data-font-size', 'medium');
      }
    }
  }, [mounted]);

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {(theme === 'system' || theme === 'light') ? (
            <Sun className="h-4 w-4" />
          ) : theme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : theme === 'high-contrast' ? (
            <Contrast className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {(theme === 'system' || theme === 'light')
              ? t('common.light') || 'Claro'
              : theme === 'dark'
              ? t('common.dark') || 'Oscuro'
              : theme === 'high-contrast'
              ? t('common.highContrast') || 'Alto Contraste'
              : t('common.system') || 'Sistema'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('common.theme') || 'Tema'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('common.light') || 'Claro'}</span>
          {(theme === 'system' || theme === 'light') && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('common.dark') || 'Oscuro'}</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('high-contrast')}>
          <Contrast className="mr-2 h-4 w-4" />
          <span>{t('common.highContrast') || 'Alto Contraste'}</span>
          {theme === 'high-contrast' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('common.system') || 'Sistema'}</span>
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('common.fontSize') || 'Tamaño de Fuente'}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleFontSizeChange('small')}>
          <Type className="mr-2 h-4 w-4" />
          <span>{t('common.small') || 'Pequeño'}</span>
          {fontSize === 'small' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFontSizeChange('medium')}>
          <Type className="mr-2 h-4 w-4" />
          <span>{t('common.medium') || 'Mediano'}</span>
          {fontSize === 'medium' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFontSizeChange('large')}>
          <Type className="mr-2 h-4 w-4" />
          <span>{t('common.large') || 'Grande'}</span>
          {fontSize === 'large' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

