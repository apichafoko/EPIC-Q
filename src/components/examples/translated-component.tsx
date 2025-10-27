'use client';

import { useTranslations } from '../../hooks/useTranslations';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export function TranslatedComponent() {
  const { t, locale } = useTranslations();

  // Ejemplo de datos
  const sampleData = {
    hospitalName: 'Hospital General de Buenos Aires',
    totalCases: 1250,
    completionRate: 87.5,
    lastActivity: new Date('2024-01-15T10:30:00'),
    budget: 50000
  };

  // Funciones de formateo simples
  const formatNumber = (num: number) => num.toLocaleString(locale);
  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'ARS' 
  }).format(amount);
  const formatDate = (date: Date) => date.toLocaleDateString(locale);
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffInDays} días atrás`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Textos traducidos */}
          <div>
            <h3 className="text-lg font-semibold">{t('hospitals.hospitalName')}</h3>
            <p className="text-gray-600">{sampleData.hospitalName}</p>
          </div>

          {/* Números formateados */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">{t('hospitals.cases')}</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(sampleData.totalCases)}
              </p>
            </div>
            <div>
              <h4 className="font-medium">{t('hospitals.completion')}</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(sampleData.completionRate)}%
              </p>
            </div>
          </div>

          {/* Moneda formateada */}
          <div>
            <h4 className="font-medium">Presupuesto</h4>
            <p className="text-xl font-semibold">
              {formatCurrency(sampleData.budget)}
            </p>
          </div>

          {/* Fechas formateadas */}
          <div className="space-y-2">
            <div>
              <h4 className="font-medium">{t('hospitals.lastActivity')}</h4>
              <p>{formatDate(sampleData.lastActivity)}</p>
            </div>
            <div>
              <h4 className="font-medium">Fecha corta</h4>
              <p>{formatDate(sampleData.lastActivity)}</p>
            </div>
            <div>
              <h4 className="font-medium">Tiempo relativo</h4>
              <p>{formatRelativeTime(sampleData.lastActivity)}</p>
            </div>
          </div>

          {/* Estados con traducciones */}
          <div className="space-y-2">
            <h4 className="font-medium">Estados de Hospital</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {t('hospitals.statusLabels.pending_approval')}
              </Badge>
              <Badge variant="outline">
                {t('hospitals.statusLabels.approved')}
              </Badge>
              <Badge variant="outline">
                {t('hospitals.statusLabels.active_recruiting')}
              </Badge>
            </div>
          </div>

          {/* Botones con traducciones */}
          <div className="flex space-x-2">
            <Button>
              {t('common.save')}
            </Button>
            <Button variant="outline">
              {t('common.cancel')}
            </Button>
            <Button variant="destructive">
              {t('common.delete')}
            </Button>
          </div>

          {/* Mensajes de validación */}
          <div className="space-y-2">
            <h4 className="font-medium">Ejemplos de Validación</h4>
            <div className="text-sm text-red-600">
              {t('forms.validation.required')}
            </div>
            <div className="text-sm text-red-600">
              {t('forms.validation.email')}
            </div>
            <div className="text-sm text-red-600">
              {t('forms.validation.minLength', { min: 5 })}
            </div>
          </div>

          {/* Placeholders */}
          <div className="space-y-2">
            <h4 className="font-medium">Placeholders</h4>
            <input 
              type="text" 
              placeholder={t('forms.placeholders.enterName')}
              className="w-full p-2 border rounded"
            />
            <input 
              type="email" 
              placeholder={t('forms.placeholders.enterEmail')}
              className="w-full p-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
