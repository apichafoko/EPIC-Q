"use client";

import React from "react";
import { Check, X, Clock } from "lucide-react";

type HospitalProgress = {
  id: string;
  hospital?: { name?: string | null } | null;
  hospital_progress?:
    | {
        progress_percentage: number | null;
        ethics_submitted?: boolean | null;
        ethics_approved?: boolean | null;
      }
    | Array<{
        progress_percentage: number | null;
        ethics_submitted?: boolean | null;
        ethics_approved?: boolean | null;
      }>
    | null;
  recruitment_periods?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    period_number: number;
  }>;
};

type StepStatus = "completed" | "pending" | "in-progress";

export function DocumentationStackedBar({
  items,
  title = "Progreso por hospital",
}: {
  items: HospitalProgress[];
  title?: string;
}) {
  const getStepStatus = (ph: HospitalProgress): {
    formulario: StepStatus;
    eticaPresentado: StepStatus;
    eticaAprobado: StepStatus;
    periodosCargados: StepStatus;
  } => {
    const progress = Array.isArray(ph.hospital_progress)
      ? ph.hospital_progress[0]
      : ph.hospital_progress;
    
    const pct = typeof progress?.progress_percentage === "number" ? progress.progress_percentage : 0;
    const hasPeriods = Array.isArray(ph.recruitment_periods) && ph.recruitment_periods.length > 0;
    
    return {
      formulario: pct >= 100 ? "completed" : pct > 0 ? "in-progress" : "pending",
      eticaPresentado: progress?.ethics_submitted ? "completed" : "pending",
      eticaAprobado: progress?.ethics_approved ? "completed" : progress?.ethics_submitted ? "in-progress" : "pending",
      periodosCargados: hasPeriods ? "completed" : "pending",
    };
  };

  const StepIcon = ({ status }: { status: StepStatus }) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const StepLabel = ({ status }: { status: StepStatus }) => {
    switch (status) {
      case "completed":
        return <span className="text-green-600 font-medium">Completado</span>;
      case "in-progress":
        return <span className="text-yellow-600 font-medium">En progreso</span>;
      case "pending":
        return <span className="text-red-500 font-medium">Pendiente</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{title}</div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" /> Completado
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-yellow-600" /> En progreso
          </div>
          <div className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-500" /> Pendiente
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        {items.map((ph) => {
          const steps = getStepStatus(ph);
          const progress = Array.isArray(ph.hospital_progress)
            ? ph.hospital_progress[0]
            : ph.hospital_progress;
          const pct = typeof progress?.progress_percentage === "number" ? progress.progress_percentage : 0;
          
          return (
            <div key={ph.id} className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50">
              {/* Nombre del hospital */}
              <div className="font-medium text-sm min-w-0 flex-1 truncate pr-4">
                {ph.hospital?.name || "Hospital"}
              </div>
              
              {/* 4 indicadores en línea */}
              <div className="flex items-center gap-6 text-xs">
                {/* Formulario */}
                <div className="flex items-center gap-1 min-w-0">
                  <StepIcon status={steps.formulario} />
                  <span className="hidden sm:inline">Formulario:</span>
                  <span className="font-mono">
                    {steps.formulario === "completed" ? (
                      <span className="text-green-600">100%</span>
                    ) : steps.formulario === "in-progress" ? (
                      <span className="text-yellow-600">{pct}%</span>
                    ) : (
                      <span className="text-red-500">0%</span>
                    )}
                  </span>
                </div>
                
                {/* Ética Presentado */}
                <div className="flex items-center gap-1 min-w-0">
                  <StepIcon status={steps.eticaPresentado} />
                  <span className="hidden sm:inline">Ética Presentado:</span>
                  <span className="font-mono">
                    {steps.eticaPresentado === "completed" ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </span>
                </div>
                
                {/* Ética Aprobado */}
                <div className="flex items-center gap-1 min-w-0">
                  <StepIcon status={steps.eticaAprobado} />
                  <span className="hidden sm:inline">Ética Aprobado:</span>
                  <span className="font-mono">
                    {steps.eticaAprobado === "completed" ? (
                      <span className="text-green-600">✓</span>
                    ) : steps.eticaAprobado === "in-progress" ? (
                      <span className="text-yellow-600">~</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </span>
                </div>
                
                {/* Períodos Cargados */}
                <div className="flex items-center gap-1 min-w-0">
                  <StepIcon status={steps.periodosCargados} />
                  <span className="hidden sm:inline">Períodos Cargados:</span>
                  <span className="font-mono">
                    {steps.periodosCargados === "completed" ? (
                      <span className="text-green-600">
                        {Array.isArray(ph.recruitment_periods) ? ph.recruitment_periods.length : 0}
                      </span>
                    ) : (
                      <span className="text-red-500">0</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentationStackedBar;


