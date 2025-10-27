'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
// Removed direct service import
import Link from 'next/link';

export function UpcomingRecruitment() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPeriods(result.data.upcomingRecruitment);
          }
        }
      } catch (error) {
        console.error('Error loading recruitment periods:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPeriods();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'planned':
        return 'Planificado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Próximos Períodos de Reclutamiento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Cargando períodos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <span>Próximos Períodos de Reclutamiento</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {periods.length > 0 ? (
          <div className="space-y-4">
            {periods.map((period) => {
              const daysUntil = getDaysUntilStart(period.start_date);
              
              return (
                <div key={period.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        Período de Reclutamiento
                      </h4>
                      <Badge className={getStatusColor(period.status)}>
                        {getStatusLabel(period.status)}
                      </Badge>
                    </div>
                    <span className="text-sm text-blue-600 block mt-1">
                      {period.hospital_name}
                    </span>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        {new Date(period.start_date).toLocaleDateString('es-AR')} - 
                        {new Date(period.end_date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className={`font-medium ${
                      daysUntil === 0 ? 'text-red-600' :
                      daysUntil <= 3 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {daysUntil === 0 ? 'Hoy' : 
                       daysUntil === 1 ? 'Mañana' : 
                       `En ${daysUntil} días`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay períodos próximos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
