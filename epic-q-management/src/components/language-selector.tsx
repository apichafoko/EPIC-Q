'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Globe } from 'lucide-react';
import { languageConfig, type Locale } from '@/i18n/config';

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const handleLanguageChange = (newLocale: Locale) => {
    // Remover el locale actual del pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Construir el nuevo path con el nuevo locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    // Navegar al nuevo path
    router.push(newPath);
    setIsOpen(false);
  };

  const currentLanguage = languageConfig[currentLocale];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(languageConfig).map(([locale, config]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale as Locale)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{config.flag}</span>
              <span>{config.name}</span>
            </div>
            {currentLocale === locale && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Componente compacto para el header
export function LanguageSelectorCompact() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const handleLanguageChange = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  const currentLanguage = languageConfig[currentLocale];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 px-2"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(languageConfig).map(([locale, config]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale as Locale)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{config.flag}</span>
              <span className="text-sm">{config.name}</span>
            </div>
            {currentLocale === locale && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
