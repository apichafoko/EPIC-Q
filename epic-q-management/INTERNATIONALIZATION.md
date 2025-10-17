# Sistema de Internacionalización - EPIC-Q

Este documento explica cómo usar el sistema de internacionalización (i18n) implementado en el sistema EPIC-Q, que soporta español, portugués e inglés.

## 🌍 Idiomas Soportados

- **Español (es)** - Idioma por defecto
- **Portugués (pt)** - Português brasileiro
- **Inglés (en)** - English

## 🚀 Configuración

### 1. Estructura de Archivos

```
src/
├── i18n/
│   └── config.ts              # Configuración de idiomas
├── messages/
│   ├── es.json               # Traducciones en español
│   ├── pt.json               # Traducciones en portugués
│   └── en.json               # Traducciones en inglés
├── hooks/
│   └── useTranslations.ts    # Hook personalizado para traducciones
├── components/
│   └── language-selector.tsx # Selector de idioma
└── lib/
    └── format-utils.ts       # Utilidades de formateo
```

### 2. Configuración de Next.js

El sistema usa `next-intl` para la internacionalización. La configuración se encuentra en:

- `next.config.js` - Configuración de Next.js
- `src/middleware.ts` - Middleware para manejo de rutas
- `src/i18n/config.ts` - Configuración de idiomas

## 📝 Uso en Componentes

### Hook useTranslations

```tsx
import { useTranslations } from '@/hooks/useTranslations';

function MyComponent() {
  const { t, formatDate, formatNumber, formatCurrency } = useTranslations();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('hospitals.totalHospitals')}: {formatNumber(45)}</p>
      <p>{formatDate(new Date())}</p>
      <p>{formatCurrency(1000)}</p>
    </div>
  );
}
```

### Hook useT (versión simple)

```tsx
import { useT } from '@/hooks/useTranslations';

function SimpleComponent() {
  const t = useT();

  return <h1>{t('dashboard.title')}</h1>;
}
```

### Selector de Idioma

```tsx
import { LanguageSelector } from '@/components/language-selector';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

## 🔧 Funciones de Formateo

### Fechas

```tsx
const { formatDate, formatDateShort, formatDateTime, formatRelativeTime } = useTranslations();

// Fecha completa
formatDate(new Date()) // "15 de enero de 2024"

// Fecha corta
formatDateShort(new Date()) // "15/01/2024"

// Fecha y hora
formatDateTime(new Date()) // "15 de enero de 2024, 10:30"

// Tiempo relativo
formatRelativeTime(new Date()) // "hace 2 horas"
```

### Números y Moneda

```tsx
const { formatNumber, formatCurrency, formatPercentage } = useTranslations();

// Número
formatNumber(1234.56) // "1.234,56" (es) / "1,234.56" (en)

// Moneda
formatCurrency(1000) // "$1.000" (es) / "R$ 1.000" (pt) / "$1,000" (en)

// Porcentaje
formatPercentage(87.5) // "87,5%" (es) / "87,5%" (pt) / "87.5%" (en)
```

## 📚 Estructura de Traducciones

### Organización por Secciones

```json
{
  "common": {
    "loading": "Cargando...",
    "save": "Guardar",
    "cancel": "Cancelar"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "hospitals": "Hospitales"
  },
  "hospitals": {
    "title": "Hospitales",
    "newHospital": "Nuevo Hospital",
    "statusLabels": {
      "pending_approval": "Pendiente de Aprobación",
      "approved": "Aprobado"
    }
  }
}
```

### Interpolación de Variables

```tsx
// En el JSON
{
  "forms": {
    "validation": {
      "minLength": "Debe tener al menos {min} caracteres"
    }
  }
}

// En el componente
t('forms.validation.minLength', { min: 5 }) // "Debe tener al menos 5 caracteres"
```

## 🎨 Configuración por Idioma

Cada idioma tiene su propia configuración:

```typescript
export const languageConfig = {
  es: {
    name: 'Español',
    flag: '🇪🇸',
    dateFormat: 'DD/MM/YYYY',
    currency: 'ARS'
  },
  pt: {
    name: 'Português',
    flag: '🇧🇷',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL'
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  }
};
```

## 🔄 Cambio de Idioma

### Programáticamente

```tsx
import { useLanguage } from '@/contexts/language-context';

function LanguageSwitcher() {
  const { setLanguage, currentLocale } = useLanguage();

  return (
    <button onClick={() => setLanguage('en')}>
      Cambiar a Inglés
    </button>
  );
}
```

### Con el Selector de Idioma

El componente `LanguageSelector` maneja automáticamente el cambio de idioma y la navegación.

## 📱 Rutas con Idioma

Las rutas incluyen el idioma como prefijo:

- `/es/dashboard` - Dashboard en español
- `/pt/dashboard` - Dashboard en portugués
- `/en/dashboard` - Dashboard en inglés

## 🛠️ Agregar Nuevas Traducciones

### 1. Agregar al archivo JSON

```json
{
  "nuevaSeccion": {
    "nuevaClave": "Nuevo texto en español"
  }
}
```

### 2. Agregar a todos los idiomas

Asegúrate de agregar la misma clave en todos los archivos de idioma.

### 3. Usar en el componente

```tsx
const t = useT();
const text = t('nuevaSeccion.nuevaClave');
```

## 🧪 Testing

### Componente de Ejemplo

Puedes usar el componente `TranslatedComponent` para probar todas las funcionalidades:

```tsx
import { TranslatedComponent } from '@/components/examples/translated-component';

function TestPage() {
  return <TranslatedComponent />;
}
```

## 📋 Mejores Prácticas

1. **Usa claves descriptivas**: `hospitals.newHospital` en lugar de `hospitals.new`
2. **Agrupa por funcionalidad**: Organiza las traducciones por secciones lógicas
3. **Mantén consistencia**: Usa la misma estructura en todos los idiomas
4. **Usa interpolación**: Para textos dinámicos, usa variables `{variable}`
5. **Formatea correctamente**: Usa las funciones de formateo para números, fechas y monedas
6. **Prueba todos los idiomas**: Verifica que las traducciones se vean bien en todos los idiomas

## 🐛 Solución de Problemas

### Error: "useTranslations must be used within a NextIntlClientProvider"

Asegúrate de que el componente esté envuelto en el provider de internacionalización.

### Error: "Translation key not found"

Verifica que la clave existe en el archivo JSON del idioma correspondiente.

### Formateo incorrecto

Verifica que estés usando las funciones de formateo correctas para el tipo de dato.

## 🔗 Recursos Adicionales

- [Documentación de next-intl](https://next-intl-docs.vercel.app/)
- [Documentación de Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Guía de internacionalización de Next.js](https://nextjs.org/docs/advanced-features/i18n)
