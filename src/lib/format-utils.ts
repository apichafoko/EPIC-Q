import { languageConfig, type Locale } from '../i18n/config';

// Utilidades de formateo para diferentes idiomas
export class FormatUtils {
  private locale: Locale;
  private config: typeof languageConfig[Locale];

  constructor(locale: Locale) {
    this.locale = locale;
    this.config = languageConfig[locale];
  }

  // Formatear fechas
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeCode = this.getLocaleCode();
    
    return new Intl.DateTimeFormat(localeCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(dateObj);
  }

  // Formatear fechas cortas
  formatDateShort(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeCode = this.getLocaleCode();
    
    return new Intl.DateTimeFormat(localeCode, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  }

  // Formatear tiempo
  formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeCode = this.getLocaleCode();
    
    return new Intl.DateTimeFormat(localeCode, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj);
  }

  // Formatear fecha y tiempo
  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeCode = this.getLocaleCode();
    
    return new Intl.DateTimeFormat(localeCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  // Formatear fechas relativas
  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return this.t('time.now');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${this.t('time.minutes')} ${this.t('time.ago')}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${this.t('time.hours')} ${this.t('time.ago')}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${this.t('time.days')} ${this.t('time.ago')}`;
    }

    return this.formatDate(dateObj);
  }

  // Formatear números
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const localeCode = this.getLocaleCode();
    return new Intl.NumberFormat(localeCode, {
      ...options
    }).format(number);
  }

  // Formatear moneda
  formatCurrency(amount: number, currency?: string): string {
    const currencyCode = currency || this.config.currency;
    const localeCode = this.getLocaleCode();
    
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  // Formatear porcentaje
  formatPercentage(value: number, decimals: number = 0): string {
    const localeCode = this.getLocaleCode();
    return new Intl.NumberFormat(localeCode, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  // Formatear fechas según configuración del idioma
  formatDateByConfig(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return this.formatDateCustom(dateObj, this.config.dateFormat);
  }

  // Formatear tiempo según configuración del idioma
  formatTimeByConfig(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return this.formatDateCustom(dateObj, this.config.timeFormat);
  }

  // Formatear fechas con formato personalizado
  formatDateCustom(date: Date | string, format: string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return format
      .replace('YYYY', dateObj.getFullYear().toString())
      .replace('MM', (dateObj.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', dateObj.getDate().toString().padStart(2, '0'))
      .replace('HH', dateObj.getHours().toString().padStart(2, '0'))
      .replace('mm', dateObj.getMinutes().toString().padStart(2, '0'))
      .replace('ss', dateObj.getSeconds().toString().padStart(2, '0'))
      .replace('MMMM', this.getMonthName(dateObj.getMonth() + 1))
      .replace('dddd', this.getDayName(dateObj.getDay()));
  }

  // Obtener nombre del mes
  getMonthName(month: number): string {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return this.t(`months.${months[month - 1]}`);
  }

  // Obtener nombre del día
  getDayName(day: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return this.t(`days.${days[day]}`);
  }

  // Obtener código de locale para Intl
  private getLocaleCode(): string {
    switch (this.locale) {
      case 'en':
        return 'en-US';
      case 'pt':
        return 'pt-BR';
      case 'es':
      default:
        return 'es-AR';
    }
  }

  // Función temporal para traducciones (debería ser reemplazada por el hook real)
  private t(key: string): string {
    // Esta es una implementación temporal
    // En la práctica, deberías usar el hook useTranslations
    const translations: Record<string, string> = {
      'time.now': this.locale === 'en' ? 'Now' : this.locale === 'pt' ? 'Agora' : 'Ahora',
      'time.minutes': this.locale === 'en' ? 'minutes' : this.locale === 'pt' ? 'minutos' : 'minutos',
      'time.hours': this.locale === 'en' ? 'hours' : this.locale === 'pt' ? 'horas' : 'horas',
      'time.days': this.locale === 'en' ? 'days' : this.locale === 'pt' ? 'dias' : 'días',
      'time.ago': this.locale === 'en' ? 'ago' : this.locale === 'pt' ? 'atrás' : 'hace',
      'months.january': this.locale === 'en' ? 'January' : this.locale === 'pt' ? 'Janeiro' : 'Enero',
      'months.february': this.locale === 'en' ? 'February' : this.locale === 'pt' ? 'Fevereiro' : 'Febrero',
      'months.march': this.locale === 'en' ? 'March' : this.locale === 'pt' ? 'Março' : 'Marzo',
      'months.april': this.locale === 'en' ? 'April' : this.locale === 'pt' ? 'Abril' : 'Abril',
      'months.may': this.locale === 'en' ? 'May' : this.locale === 'pt' ? 'Maio' : 'Mayo',
      'months.june': this.locale === 'en' ? 'June' : this.locale === 'pt' ? 'Junho' : 'Junio',
      'months.july': this.locale === 'en' ? 'July' : this.locale === 'pt' ? 'Julho' : 'Julio',
      'months.august': this.locale === 'en' ? 'August' : this.locale === 'pt' ? 'Agosto' : 'Agosto',
      'months.september': this.locale === 'en' ? 'September' : this.locale === 'pt' ? 'Setembro' : 'Septiembre',
      'months.october': this.locale === 'en' ? 'October' : this.locale === 'pt' ? 'Outubro' : 'Octubre',
      'months.november': this.locale === 'en' ? 'November' : this.locale === 'pt' ? 'Novembro' : 'Noviembre',
      'months.december': this.locale === 'en' ? 'December' : this.locale === 'pt' ? 'Dezembro' : 'Diciembre',
      'days.sunday': this.locale === 'en' ? 'Sunday' : this.locale === 'pt' ? 'Domingo' : 'Domingo',
      'days.monday': this.locale === 'en' ? 'Monday' : this.locale === 'pt' ? 'Segunda-feira' : 'Lunes',
      'days.tuesday': this.locale === 'en' ? 'Tuesday' : this.locale === 'pt' ? 'Terça-feira' : 'Martes',
      'days.wednesday': this.locale === 'en' ? 'Wednesday' : this.locale === 'pt' ? 'Quarta-feira' : 'Miércoles',
      'days.thursday': this.locale === 'en' ? 'Thursday' : this.locale === 'pt' ? 'Quinta-feira' : 'Jueves',
      'days.friday': this.locale === 'en' ? 'Friday' : this.locale === 'pt' ? 'Sexta-feira' : 'Viernes',
      'days.saturday': this.locale === 'en' ? 'Saturday' : this.locale === 'pt' ? 'Sábado' : 'Sábado'
    };
    
    return translations[key] || key;
  }
}

// Función factory para crear instancia de FormatUtils
export function createFormatUtils(locale: Locale): FormatUtils {
  return new FormatUtils(locale);
}

// Instancia global (se actualizará dinámicamente)
let globalFormatUtils: FormatUtils | null = null;

export function getFormatUtils(locale: Locale): FormatUtils {
  if (!globalFormatUtils || globalFormatUtils['locale'] !== locale) {
    globalFormatUtils = new FormatUtils(locale);
  }
  return globalFormatUtils;
}
