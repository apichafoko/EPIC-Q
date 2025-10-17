'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CoordinatorProgressPage() {
  const { t } = useTranslations();
  const [progressData, setProgressData] = useState({
    ethicsSubmitted: false,
    ethicsSubmittedDate: null as Date | null,
    ethicsApproved: false,
    ethicsApprovedDate: null as Date | null,
    ethicsDocument: null as File | null,
    recruitmentStartDate: null as Date | null,
    recruitmentEndDate: null as Date | null,
    recruitmentPeriods: [] as Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      status: 'planned' | 'active' | 'completed';
    }>
  });

  const [showCalendar, setShowCalendar] = useState<'ethicsSubmitted' | 'ethicsApproved' | 'recruitmentStart' | 'recruitmentEnd' | null>(null);

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setProgressData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      setProgressData(prev => ({
        ...prev,
        [field]: date
      }));
    }
    setShowCalendar(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setProgressData(prev => ({
        ...prev,
        ethicsDocument: file
      }));
    }
  };

  const addRecruitmentPeriod = () => {
    if (progressData.recruitmentStartDate && progressData.recruitmentEndDate) {
      const newPeriod = {
        id: Date.now().toString(),
        startDate: progressData.recruitmentStartDate,
        endDate: progressData.recruitmentEndDate,
        status: 'planned' as const
      };
      
      setProgressData(prev => ({
        ...prev,
        recruitmentPeriods: [...prev.recruitmentPeriods, newPeriod],
        recruitmentStartDate: null,
        recruitmentEndDate: null
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Activo</Badge>;
      case 'planned':
        return <Badge className="bg-yellow-100 text-yellow-800">Planificado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const overallProgress = [
    { label: 'Ética Enviada', completed: progressData.ethicsSubmitted },
    { label: 'Ética Aprobada', completed: progressData.ethicsApproved },
    { label: 'Períodos de Reclutamiento', completed: progressData.recruitmentPeriods.length > 0 }
  ].filter(item => item.completed).length;

  const progressPercentage = (overallProgress / 3) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.progress')}</h1>
        <p className="text-gray-600 mt-2">
          Gestiona el progreso del estudio en tu hospital
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
          <CardDescription>
            Estado actual del estudio en tu hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progreso General</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {overallProgress.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${item.completed ? 'text-green-700' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ethics Committee Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Comité de Ética</span>
          </CardTitle>
          <CardDescription>
            Gestiona la presentación y aprobación del comité de ética
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ethics Submitted */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ethicsSubmitted"
                checked={progressData.ethicsSubmitted}
                onCheckedChange={(checked) => handleCheckboxChange('ethicsSubmitted', checked as boolean)}
              />
              <Label htmlFor="ethicsSubmitted" className="text-base font-medium">
                Presentado al Comité de Ética
              </Label>
            </div>

            {progressData.ethicsSubmitted && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="ethicsSubmittedDate">Fecha de Presentación</Label>
                <Popover open={showCalendar === 'ethicsSubmitted'} onOpenChange={() => setShowCalendar(showCalendar === 'ethicsSubmitted' ? null : 'ethicsSubmitted')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.ethicsSubmittedDate ? 
                        format(progressData.ethicsSubmittedDate, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.ethicsSubmittedDate || undefined}
                      onSelect={(date) => handleDateChange('ethicsSubmittedDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Ethics Approved */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ethicsApproved"
                checked={progressData.ethicsApproved}
                onCheckedChange={(checked) => handleCheckboxChange('ethicsApproved', checked as boolean)}
                disabled={!progressData.ethicsSubmitted}
              />
              <Label htmlFor="ethicsApproved" className="text-base font-medium">
                Aprobado por el Comité de Ética
              </Label>
            </div>

            {progressData.ethicsApproved && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ethicsApprovedDate">Fecha de Aprobación</Label>
                  <Popover open={showCalendar === 'ethicsApproved'} onOpenChange={() => setShowCalendar(showCalendar === 'ethicsApproved' ? null : 'ethicsApproved')}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {progressData.ethicsApprovedDate ? 
                          format(progressData.ethicsApprovedDate, 'PPP', { locale: es }) : 
                          'Seleccionar fecha'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={progressData.ethicsApprovedDate || undefined}
                        onSelect={(date) => handleDateChange('ethicsApprovedDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ethicsDocument">Documento de Aprobación (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="ethicsDocument"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('ethicsDocument')?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Subir PDF</span>
                    </Button>
                    {progressData.ethicsDocument && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{progressData.ethicsDocument.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Handle download */}}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Periods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Períodos de Reclutamiento</span>
          </CardTitle>
          <CardDescription>
            Define los períodos de reclutamiento para tu hospital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Period */}
          <div className="space-y-4">
            <h4 className="font-medium">Agregar Nuevo Período</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Popover open={showCalendar === 'recruitmentStart'} onOpenChange={() => setShowCalendar(showCalendar === 'recruitmentStart' ? null : 'recruitmentStart')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.recruitmentStartDate ? 
                        format(progressData.recruitmentStartDate, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.recruitmentStartDate || undefined}
                      onSelect={(date) => handleDateChange('recruitmentStartDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Popover open={showCalendar === 'recruitmentEnd'} onOpenChange={() => setShowCalendar(showCalendar === 'recruitmentEnd' ? null : 'recruitmentEnd')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.recruitmentEndDate ? 
                        format(progressData.recruitmentEndDate, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.recruitmentEndDate || undefined}
                      onSelect={(date) => handleDateChange('recruitmentEndDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              onClick={addRecruitmentPeriod}
              disabled={!progressData.recruitmentStartDate || !progressData.recruitmentEndDate}
            >
              Agregar Período
            </Button>
          </div>

          {/* Existing Periods */}
          {progressData.recruitmentPeriods.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Períodos Configurados</h4>
              <div className="space-y-2">
                {progressData.recruitmentPeriods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {format(period.startDate, 'dd/MM/yyyy', { locale: es })} - {format(period.endDate, 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))} días
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(period.status)}
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {progressData.recruitmentPeriods.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debes configurar al menos un período de reclutamiento para continuar con el estudio.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
