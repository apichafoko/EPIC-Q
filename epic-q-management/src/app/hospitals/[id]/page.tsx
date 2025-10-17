'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { HospitalInfoTab } from '@/components/hospitals/hospital-info-tab';
import { HospitalProgressTab } from '@/components/hospitals/hospital-progress-tab';
import { HospitalRecruitmentTab } from '@/components/hospitals/hospital-recruitment-tab';
import { HospitalMetricsTab } from '@/components/hospitals/hospital-metrics-tab';
import { HospitalCommunicationsTab } from '@/components/hospitals/hospital-communications-tab';
import { 
  getHospitalById, 
  getContactsByHospital, 
  getProgressByHospital, 
  getPeriodsByHospital, 
  getMetricsByHospital, 
  getCommunicationsByHospital,
  mockHospitalDetails 
} from '@/lib/mock-data';
import { statusConfig } from '@/types';

export default function HospitalDetailPage() {
  const params = useParams();
  const hospitalId = params.id as string;
  
  const hospital = getHospitalById(hospitalId);
  const contacts = getContactsByHospital(hospitalId);
  const progress = getProgressByHospital(hospitalId);
  const periods = getPeriodsByHospital(hospitalId);
  const metrics = getMetricsByHospital(hospitalId);
  const communications = getCommunicationsByHospital(hospitalId);
  const details = mockHospitalDetails.find(d => d.hospital_id === hospitalId);

  if (!hospital) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hospital no encontrado</h1>
          <p className="text-gray-600 mb-6">El hospital solicitado no existe o ha sido eliminado.</p>
          <Link href="/hospitals">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Hospitales
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfigData = statusConfig[hospital.status];
  const coordinator = contacts.find(c => c.is_primary);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/hospitals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge className={`${statusConfigData.color} flex items-center space-x-1`}>
                <span>{statusConfigData.icon}</span>
                <span>{statusConfigData.label}</span>
              </Badge>
              <span className="text-gray-600">{hospital.city}, {hospital.province}</span>
              {hospital.redcap_id && (
                <span className="text-sm text-gray-500">ID: {hospital.redcap_id}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {coordinator && (
            <>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              {coordinator.phone && (
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
              )}
            </>
          )}
          <Link href={`/hospitals/${hospital.id}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Información General</TabsTrigger>
          <TabsTrigger value="progress">Progreso del Estudio</TabsTrigger>
          <TabsTrigger value="recruitment">Períodos de Reclutamiento</TabsTrigger>
          <TabsTrigger value="metrics">Métricas de Casos</TabsTrigger>
          <TabsTrigger value="communications">Comunicaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <HospitalInfoTab 
            hospital={hospital}
            details={details}
            contacts={contacts}
          />
        </TabsContent>

        <TabsContent value="progress">
          <HospitalProgressTab 
            hospital={hospital}
            progress={progress}
          />
        </TabsContent>

        <TabsContent value="recruitment">
          <HospitalRecruitmentTab 
            periods={periods}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <HospitalMetricsTab 
            metrics={metrics}
            hospitalName={hospital.name}
          />
        </TabsContent>

        <TabsContent value="communications">
          <HospitalCommunicationsTab 
            communications={communications}
            hospitalName={hospital.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
