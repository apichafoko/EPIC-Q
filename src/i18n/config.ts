// Idiomas soportados
export const locales = ['es', 'pt', 'en'] as const;
export type Locale = (typeof locales)[number];

// Configuración por defecto
export const defaultLocale: Locale = 'es';

// Configuración de idiomas
export const languageConfig = {
  es: {
    name: 'Español',
    flag: '🇪🇸',
    direction: 'ltr' as const,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'ARS',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  pt: {
    name: 'Português',
    flag: '🇧🇷',
    direction: 'ltr' as const,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'BRL',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr' as const,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: 'USD',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  }
};

// Función para validar locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Esta función ya está en request.ts
