import { 
  Hospital, 
  HospitalDetails, 
  Contact, 
  HospitalProgress, 
  RecruitmentPeriod, 
  CaseMetrics, 
  Communication, 
  Alert, 
  EmailTemplate,
  User,
  DashboardKPIs,
  ChartData,
  TimeSeriesData,
  provinces,
  specialties,
  financingTypes,
  communicationTypes,
  alertTypes,
  alertSeverities,
  templateCategories,
  statusConfig
} from '@/types';

// Función para generar fechas aleatorias (con seed para consistencia)
const randomDate = (start: Date, end: Date, seed: number = 0): string => {
  const random = Math.sin(seed) * 10000;
  const randomValue = random - Math.floor(random);
  return new Date(start.getTime() + randomValue * (end.getTime() - start.getTime())).toISOString();
};

// Función para generar ID único (con seed para consistencia)
const generateId = (seed: number = 0): string => {
  const random = Math.sin(seed) * 10000;
  const randomValue = random - Math.floor(random);
  return Math.floor(randomValue * 1000000000).toString(36);
};

// Nombres de hospitales reales de Argentina
const hospitalNames = [
  'Hospital Italiano de Buenos Aires',
  'Hospital Fernández',
  'Hospital Rawson',
  'Hospital Provincial de Rosario',
  'Hospital Privado de Córdoba',
  'Hospital El Cruce',
  'Hospital de Clínicas José de San Martín',
  'Hospital Alemán',
  'Hospital Británico',
  'Hospital Santojanni',
  'Hospital Ramos Mejía',
  'Hospital Rivadavia',
  'Hospital Durand',
  'Hospital Argerich',
  'Hospital Piñero',
  'Hospital Tornú',
  'Hospital Pirovano',
  'Hospital Penna',
  'Hospital Zubizarreta',
  'Hospital Santamarina',
  'Hospital Municipal de San Isidro',
  'Hospital Central de Mendoza',
  'Hospital Español de Mendoza',
  'Hospital Central de San Juan',
  'Hospital Rawson de San Juan',
  'Hospital Privado de Tucumán',
  'Hospital Padilla de Tucumán',
  'Hospital Central de Salta',
  'Hospital San Bernardo de Salta',
  'Hospital Central de Córdoba',
  'Hospital Privado de Córdoba',
  'Hospital San Roque de Córdoba',
  'Hospital Central de Santa Fe',
  'Hospital Provincial de Santa Fe',
  'Hospital Central de La Plata',
  'Hospital San Martín de La Plata',
  'Hospital Central de Mar del Plata',
  'Hospital Privado de Mar del Plata',
  'Hospital Central de Bahía Blanca',
  'Hospital Privado de Bahía Blanca',
  'Hospital Central de Neuquén',
  'Hospital Privado de Neuquén',
  'Hospital Central de Río Negro',
  'Hospital Privado de Río Negro',
  'Hospital Central de Chubut'
];

// Generar hospitales
export const mockHospitals: Hospital[] = hospitalNames.map((name, index) => {
  const statuses: Hospital['status'][] = [
    'initial_contact', 'pending_evaluation', 'ethics_approval_process', 
    'redcap_setup', 'active_recruiting', 'completed', 'inactive'
  ];
  
  const statusWeights = [8, 12, 15, 5, 20, 3, 2]; // Distribución realista
  const randomStatus = Math.sin(index * 1.1) * 10000;
  const randomValue = randomStatus - Math.floor(randomStatus);
  let cumulativeWeight = 0;
  let selectedStatus: Hospital['status'] = 'initial_contact';
  
  for (let i = 0; i < statuses.length; i++) {
    cumulativeWeight += statusWeights[i] / 100;
    if (randomValue <= cumulativeWeight) {
      selectedStatus = statuses[i];
      break;
    }
  }

  const province = provinces[Math.floor(Math.sin(index * 1.2) * 10000) % provinces.length];
  const createdDate = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31), index);
  
  return {
    id: generateId(index),
    redcap_id: selectedStatus === 'inactive' ? undefined : `H${String(index + 1).padStart(3, '0')}`,
    name,
    province,
    city: generateCityName(province, index),
    status: selectedStatus,
    participated_lasos: Math.sin(index * 1.3) > 0.3,
    progress_percentage: calculateProgressPercentage(selectedStatus, index),
    created_at: createdDate,
    updated_at: randomDate(new Date(createdDate), new Date(), index + 1000)
  };
});

// Función auxiliar para generar nombres de ciudades
function generateCityName(province: string, seed: number = 0): string {
  const cityMap: Record<string, string[]> = {
    'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría'],
    'CABA': ['Buenos Aires'],
    'Córdoba': ['Córdoba', 'Río Cuarto', 'Villa María'],
    'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela'],
    'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz'],
    'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena'],
    'Salta': ['Salta', 'Tartagal'],
    'San Juan': ['San Juan', 'Rawson'],
    'Neuquén': ['Neuquén', 'Cutral Co'],
    'Río Negro': ['Bariloche', 'Viedma', 'General Roca'],
    'Chubut': ['Comodoro Rivadavia', 'Trelew', 'Puerto Madryn'],
    'La Pampa': ['Santa Rosa', 'General Pico'],
    'La Rioja': ['La Rioja', 'Chilecito'],
    'Catamarca': ['San Fernando del Valle de Catamarca'],
    'Santiago del Estero': ['Santiago del Estero'],
    'Formosa': ['Formosa'],
    'Chaco': ['Resistencia', 'Sáenz Peña'],
    'Corrientes': ['Corrientes', 'Goya'],
    'Entre Ríos': ['Paraná', 'Concordia'],
    'Misiones': ['Posadas', 'Oberá'],
    'Jujuy': ['San Salvador de Jujuy'],
    'San Luis': ['San Luis', 'Villa Mercedes'],
    'Santa Cruz': ['Río Gallegos', 'Calafate'],
    'Tierra del Fuego': ['Ushuaia', 'Río Grande']
  };
  
  const cities = cityMap[province] || ['Ciudad Principal'];
  const cityRandom = Math.sin(seed * 3.6) * 10000;
  return cities[Math.floor(Math.abs(cityRandom) % cities.length)];
}

// Función para calcular porcentaje de progreso basado en estado
function calculateProgressPercentage(status: Hospital['status'], seed: number = 0): number {
  const baseProgress = {
    'initial_contact': 10,
    'pending_evaluation': 25,
    'ethics_approval_process': 45,
    'redcap_setup': 65,
    'active_recruiting': 85,
    'completed': 100,
    'inactive': 0
  };
  
  const base = baseProgress[status];
  const variationRandom = Math.sin(seed * 3.5) * 10000;
  const variation = Math.floor(Math.abs(variationRandom) % 15);
  return base + variation;
}

// Generar detalles de hospitales
export const mockHospitalDetails: HospitalDetails[] = mockHospitals.map((hospital, index) => {
  const seed = index + 20000;
  const financingRandom = Math.sin(seed * 2.4) * 10000;
  const bedsRandom = Math.sin(seed * 2.5) * 10000;
  const orRandom = Math.sin(seed * 2.6) * 10000;
  const icuRandom = Math.sin(seed * 2.7) * 10000;
  const surgeriesRandom = Math.sin(seed * 2.8) * 10000;
  const residencyRandom = Math.sin(seed * 2.9) * 10000;
  const clinicRandom = Math.sin(seed * 3.0) * 10000;
  const responseRandom = Math.sin(seed * 3.1) * 10000;
  const ethicsRandom = Math.sin(seed * 3.2) * 10000;
  const universityRandom = Math.sin(seed * 3.3) * 10000;
  const notesRandom = Math.sin(seed * 3.4) * 10000;
  
  return {
    hospital_id: hospital.id,
    financing_type: financingTypes[Math.floor(Math.abs(financingRandom) % financingTypes.length)],
    num_beds: Math.floor(Math.abs(bedsRandom) % 500) + 50,
    num_operating_rooms: Math.floor(Math.abs(orRandom) % 15) + 2,
    num_icu_beds: Math.floor(Math.abs(icuRandom) % 30) + 5,
    avg_weekly_surgeries: Math.floor(Math.abs(surgeriesRandom) % 100) + 10,
    has_residency_program: Math.abs(residencyRandom) > 0.4,
    has_preop_clinic: ['always', 'sometimes', 'never'][Math.floor(Math.abs(clinicRandom) % 3)] as 'always' | 'sometimes' | 'never',
    has_rapid_response_team: Math.abs(responseRandom) > 0.3,
    has_ethics_committee: Math.abs(ethicsRandom) > 0.2,
    university_affiliated: Math.abs(universityRandom) > 0.5,
    notes: Math.abs(notesRandom) > 0.7 ? 'Hospital con características especiales para el estudio' : undefined
  };
});

// Generar contactos
export const mockContacts: Contact[] = mockHospitals.flatMap((hospital, hospitalIndex) => {
  const contacts: Contact[] = [];
  
  // Coordinador principal
  contacts.push({
    id: generateId(hospitalIndex + 10000),
    hospital_id: hospital.id,
    role: 'coordinator',
    name: generateRandomName(hospitalIndex + 10000),
    email: `coordinator.${hospital.id}@hospital.com`,
    phone: generatePhoneNumber(hospitalIndex + 10000),
    specialty: specialties[Math.floor(Math.abs(Math.sin(hospitalIndex * 1.9) * 10000) % specialties.length)],
    is_primary: true
  });
  
  // Colaboradores (1-4 por hospital)
  const numCollaborators = Math.floor(Math.abs(Math.sin(hospitalIndex * 2.0) * 10000) % 4) + 1;
  for (let i = 0; i < numCollaborators; i++) {
    contacts.push({
      id: generateId(hospitalIndex + 10000 + i + 1),
      hospital_id: hospital.id,
      role: 'collaborator',
      name: generateRandomName(hospitalIndex + 10000 + i + 1),
      email: `collaborator${i + 1}.${hospital.id}@hospital.com`,
      phone: generatePhoneNumber(hospitalIndex + 10000 + i + 1),
      specialty: specialties[Math.floor(Math.abs(Math.sin((hospitalIndex + i) * 2.1) * 10000) % specialties.length)],
      is_primary: false
    });
  }
  
  return contacts;
});

// Función para generar nombres aleatorios
function generateRandomName(seed: number = 0): string {
  const firstNames = [
    'María', 'José', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Miguel', 'Isabel',
    'Antonio', 'Rosa', 'Francisco', 'Laura', 'Manuel', 'Patricia', 'David',
    'Sandra', 'Roberto', 'Elena', 'Fernando', 'Mónica', 'Jorge', 'Beatriz',
    'Alejandro', 'Silvia', 'Pablo', 'Claudia', 'Rafael', 'Natalia', 'Diego',
    'Valeria', 'Sergio', 'Gabriela', 'Andrés', 'Cristina', 'Martín', 'Andrea'
  ];
  
  const lastNames = [
    'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
    'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández',
    'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez',
    'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
    'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Ortega', 'Delgado'
  ];
  
  const firstNameRandom = Math.sin(seed * 1.7) * 10000;
  const lastNameRandom = Math.sin(seed * 1.8) * 10000;
  const firstName = firstNames[Math.floor(Math.abs(firstNameRandom) % firstNames.length)];
  const lastName = lastNames[Math.floor(Math.abs(lastNameRandom) % lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Función para generar números de teléfono
function generatePhoneNumber(seed: number = 0): string {
  const areaCodes = ['11', '261', '351', '381', '387', '221', '223', '264', '266', '299'];
  const areaCodeRandom = Math.sin(seed * 2.2) * 10000;
  const areaCode = areaCodes[Math.floor(Math.abs(areaCodeRandom) % areaCodes.length)];
  const numberRandom = Math.sin(seed * 2.3) * 10000;
  const number = Math.floor(Math.abs(numberRandom) % 90000000) + 10000000;
  return `+54${areaCode}${number}`;
}

// Generar progreso de hospitales
export const mockHospitalProgress: HospitalProgress[] = mockHospitals.map(hospital => {
  const progress = calculateProgressPercentage(hospital.status);
  
  return {
    hospital_id: hospital.id,
    descriptive_form_status: progress > 20 ? 'complete' : progress > 10 ? 'partial' : 'pending',
    ethics_submitted: progress > 30,
    ethics_submitted_date: progress > 30 ? randomDate(new Date(2023, 6, 1), new Date()) : undefined,
    ethics_approved: progress > 50,
    ethics_approved_date: progress > 50 ? randomDate(new Date(2023, 7, 1), new Date()) : undefined,
    redcap_unit_created: progress > 60,
    coordinator_user_created: progress > 65,
    collaborator_users_created: progress > 80 ? 'yes' : progress > 70 ? 'partial' : 'no',
    num_collaborators: Math.floor(Math.random() * 4) + 1,
    ready_for_recruitment: progress > 75,
    dates_assigned_period1: progress > 80,
    dates_assigned_period2: progress > 85,
    last_contact_date: randomDate(new Date(2023, 8, 1), new Date()),
    next_followup_date: randomDate(new Date(), new Date(2024, 11, 31))
  };
});

// Generar períodos de reclutamiento
export const mockRecruitmentPeriods: RecruitmentPeriod[] = mockHospitals
  .filter(h => h.status === 'active_recruiting' || h.status === 'completed')
  .flatMap(hospital => {
    const periods: RecruitmentPeriod[] = [];
    const baseDate = new Date(2024, 0, 1);
    
    for (let i = 1; i <= 4; i++) {
      const startDate = new Date(baseDate);
      startDate.setMonth(startDate.getMonth() + (i - 1) * 4);
      startDate.setDate(1); // Primer lunes del mes
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const statuses: RecruitmentPeriod['status'][] = ['planned', 'active', 'completed', 'cancelled'];
      const status = i === 1 ? 'active' : i === 2 ? 'completed' : 'planned';
      
      periods.push({
        id: generateId(),
        hospital_id: hospital.id,
        period_number: i as 1 | 2 | 3 | 4,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status,
        notes: i === 1 ? 'Período activo de reclutamiento' : undefined
      });
    }
    
    return periods;
  });

// Generar métricas de casos
export const mockCaseMetrics: CaseMetrics[] = mockHospitals
  .filter(h => h.status === 'active_recruiting' || h.status === 'completed')
  .flatMap((hospital, hospitalIndex) => {
    const metrics: CaseMetrics[] = [];
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date();
    
    for (let d = new Date(startDate), weekIndex = 0; d <= endDate; d.setDate(d.getDate() + 7), weekIndex++) {
      const seed = hospitalIndex * 1000 + weekIndex;
      const casesCreatedRandom = Math.sin(seed * 4.0) * 10000;
      const casesCreated = Math.floor(Math.abs(casesCreatedRandom) % 20);
      
      const casesCompletedRandom = Math.sin(seed * 4.1) * 10000;
      const completionRate = 0.6 + (Math.abs(casesCompletedRandom) % 0.4);
      const casesCompleted = Math.floor(casesCreated * completionRate);
      
      metrics.push({
        hospital_id: hospital.id,
        recorded_date: d.toISOString().split('T')[0],
        cases_created: casesCreated,
        cases_completed: casesCompleted,
        completion_percentage: casesCreated > 0 ? (casesCompleted / casesCreated) * 100 : 0,
        last_case_date: casesCreated > 0 ? d.toISOString().split('T')[0] : undefined
      });
    }
    
    return metrics;
  });

// Generar comunicaciones
export const mockCommunications: Communication[] = mockHospitals.flatMap((hospital, hospitalIndex) => {
  const communications: Communication[] = [];
  const numCommunicationsRandom = Math.sin(hospitalIndex * 4.2) * 10000;
  const numCommunications = Math.floor(Math.abs(numCommunicationsRandom) % 10) + 5;
  
  for (let i = 0; i < numCommunications; i++) {
    const seed = hospitalIndex * 10000 + i;
    const typeRandom = Math.sin(seed * 4.3) * 10000;
    const type = communicationTypes[Math.floor(Math.abs(typeRandom) % communicationTypes.length)];
    const createdDate = randomDate(new Date(2023, 6, 1), new Date(), seed);
    
    const statusRandom = Math.sin(seed * 4.4) * 10000;
    const statusValues = ['sent', 'delivered', 'opened'];
    const status = type === 'email' ? statusValues[Math.floor(Math.abs(statusRandom) % statusValues.length)] as 'sent' | 'delivered' | 'opened' : 'sent';
    
    communications.push({
      id: generateId(seed),
      hospital_id: hospital.id,
      type,
      subject: generateCommunicationSubject(type, seed),
      content: generateCommunicationContent(type, seed),
      sent_by: 'admin-user-id',
      sent_to: type === 'email' ? `coordinator.${hospital.id}@hospital.com` : undefined,
      template_used: type === 'email' ? generateTemplateName(seed) : undefined,
      status,
      created_at: createdDate
    });
  }
  
  return communications;
});

function generateCommunicationSubject(type: string, seed: number = 0): string {
  const subjects = {
    email: [
      'Invitación a participar en el estudio EPIC-Q',
      'Recordatorio: Aprobación ética pendiente',
      'Confirmación de alta en RedCap',
      'Recordatorio: Período de reclutamiento próximo',
      'Seguimiento: Baja completitud de casos',
      'Reporte mensual de avances'
    ],
    call: [
      'Llamada de seguimiento',
      'Coordinación de reunión',
      'Consulta sobre progreso',
      'Soporte técnico'
    ],
    meeting: [
      'Reunión de coordinación',
      'Presentación del estudio',
      'Capacitación RedCap',
      'Evaluación de progreso'
    ],
    note: [
      'Nota de seguimiento',
      'Observaciones importantes',
      'Recordatorio interno',
      'Actualización de estado'
    ],
    whatsapp: [
      'Mensaje de seguimiento',
      'Recordatorio rápido',
      'Consulta urgente'
    ]
  };
  
  const typeSubjects = subjects[type as keyof typeof subjects] || ['Comunicación'];
  const subjectRandom = Math.sin(seed * 4.8) * 10000;
  return typeSubjects[Math.floor(Math.abs(subjectRandom) % typeSubjects.length)];
}

function generateCommunicationContent(type: string, seed: number = 0): string {
  const contents = {
    email: [
      'Estimado/a coordinador/a, le escribimos para invitarlo/a a participar en el estudio EPIC-Q...',
      'Le recordamos que la documentación de aprobación ética está pendiente...',
      'Confirmamos que su hospital ha sido dado de alta en RedCap exitosamente...',
      'Le informamos que el período de reclutamiento está próximo a iniciarse...',
      'Hemos notado una baja completitud en los casos registrados...',
      'Adjuntamos el reporte mensual con los avances del estudio...'
    ],
    call: [
      'Llamada realizada para seguimiento del progreso del hospital.',
      'Se coordinó una reunión para la próxima semana.',
      'Se consultó sobre el estado actual del estudio.',
      'Se brindó soporte técnico para el uso de RedCap.'
    ],
    meeting: [
      'Reunión realizada para coordinar los próximos pasos del estudio.',
      'Se presentó el protocolo del estudio EPIC-Q al equipo médico.',
      'Se realizó capacitación sobre el uso de la plataforma RedCap.',
      'Se evaluó el progreso actual y se establecieron metas.'
    ],
    note: [
      'Nota de seguimiento: El hospital muestra buen progreso en la fase actual.',
      'Observaciones importantes: Se requiere atención especial en la documentación.',
      'Recordatorio interno: Contactar al hospital la próxima semana.',
      'Actualización de estado: El hospital ha completado la fase de aprobación ética.'
    ],
    whatsapp: [
      'Mensaje de seguimiento enviado por WhatsApp.',
      'Recordatorio rápido sobre la próxima reunión.',
      'Consulta urgente sobre el estado del estudio.'
    ]
  };
  
  const typeContents = contents[type as keyof typeof contents] || ['Comunicación realizada.'];
  const contentRandom = Math.sin(seed * 4.9) * 10000;
  return typeContents[Math.floor(Math.abs(contentRandom) % typeContents.length)];
}

function generateTemplateName(seed: number = 0): string {
  const templates = [
    'Invitación inicial',
    'Recordatorio ética',
    'Confirmación RedCap',
    'Recordatorio reclutamiento',
    'Seguimiento completitud',
    'Reporte mensual'
  ];
  const templateRandom = Math.sin(seed * 4.7) * 10000;
  return templates[Math.floor(Math.abs(templateRandom) % templates.length)];
}

// Generar alertas
export const mockAlerts: Alert[] = mockHospitals.flatMap((hospital, hospitalIndex) => {
  const alerts: Alert[] = [];
  
  // Alerta de inactividad (30% de probabilidad)
  const inactivityRandom = Math.sin(hospitalIndex * 1.4) * 10000;
  const inactivityValue = inactivityRandom - Math.floor(inactivityRandom);
  if (inactivityValue < 0.3) {
    alerts.push({
      id: generateId(hospitalIndex + 2000),
      hospital_id: hospital.id,
      alert_type: 'no_activity_30_days',
      severity: 'high',
      title: 'Hospital sin actividad por más de 30 días',
      message: `El hospital ${hospital.name} no ha registrado actividad en los últimos 30 días.`,
      is_resolved: false,
      created_at: randomDate(new Date(2024, 8, 1), new Date(), hospitalIndex + 3000)
    });
  }
  
  // Alerta de baja completitud (20% de probabilidad)
  const completionRandom = Math.sin(hospitalIndex * 1.5) * 10000;
  const completionValue = completionRandom - Math.floor(completionRandom);
  if (completionValue < 0.2) {
    alerts.push({
      id: generateId(hospitalIndex + 4000),
      hospital_id: hospital.id,
      alert_type: 'low_completion_rate',
      severity: 'medium',
      title: 'Baja completitud de casos',
      message: `El hospital ${hospital.name} tiene una completitud de casos menor al 70%.`,
      is_resolved: false,
      created_at: randomDate(new Date(2024, 9, 1), new Date(), hospitalIndex + 5000)
    });
  }
  
  // Alerta de período próximo (15% de probabilidad)
  const periodRandom = Math.sin(hospitalIndex * 1.6) * 10000;
  const periodValue = periodRandom - Math.floor(periodRandom);
  if (periodValue < 0.15) {
    alerts.push({
      id: generateId(hospitalIndex + 6000),
      hospital_id: hospital.id,
      alert_type: 'upcoming_recruitment_period',
      severity: 'low',
      title: 'Período de reclutamiento próximo',
      message: `El próximo período de reclutamiento del hospital ${hospital.name} inicia en 7 días.`,
      is_resolved: false,
      created_at: randomDate(new Date(2024, 10, 1), new Date(), hospitalIndex + 7000)
    });
  }
  
  return alerts;
});

// Generar templates de email
export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: generateId(50000),
    name: 'Invitación inicial a participar',
    category: 'recruitment',
    subject: 'Invitación a participar en el Estudio EPIC-Q',
    body: 'Estimado/a {{coordinator_name}},\n\nLe escribimos para invitarlo/a a participar en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q) que se está llevando a cabo en Argentina.\n\nEl estudio tiene como objetivo...\n\nHospital: {{hospital_name}}\nID RedCap: {{redcap_id}}\n\nSaludos cordiales,\nEquipo EPIC-Q',
    variables: ['coordinator_name', 'hospital_name', 'redcap_id'],
    is_active: true,
    usage_count: 45
  },
  {
    id: generateId(50001),
    name: 'Recordatorio aprobación ética',
    category: 'followup',
    subject: 'Recordatorio: Aprobación ética pendiente - {{hospital_name}}',
    body: 'Estimado/a {{coordinator_name}},\n\nLe recordamos que la documentación de aprobación ética para el hospital {{hospital_name}} está pendiente.\n\nPor favor, complete la documentación requerida para continuar con el estudio.\n\nSaludos,\nEquipo EPIC-Q',
    variables: ['coordinator_name', 'hospital_name'],
    is_active: true,
    usage_count: 23
  },
  {
    id: generateId(50002),
    name: 'Confirmación alta en RedCap',
    category: 'technical',
    subject: 'Confirmación: Hospital {{hospital_name}} dado de alta en RedCap',
    body: 'Estimado/a {{coordinator_name}},\n\nConfirmamos que el hospital {{hospital_name}} ha sido dado de alta exitosamente en RedCap.\n\nID RedCap: {{redcap_id}}\n\nPuede comenzar a registrar casos.\n\nSaludos,\nEquipo Técnico EPIC-Q',
    variables: ['coordinator_name', 'hospital_name', 'redcap_id'],
    is_active: true,
    usage_count: 18
  },
  {
    id: generateId(50003),
    name: 'Recordatorio período de reclutamiento',
    category: 'operations',
    subject: 'Recordatorio: Período de reclutamiento {{period_number}} próximo',
    body: 'Estimado/a {{coordinator_name}},\n\nLe informamos que el período de reclutamiento {{period_number}} del hospital {{hospital_name}} está próximo a iniciarse.\n\nFechas: {{start_date}} al {{end_date}}\n\nPor favor, prepare el equipo para el inicio del período.\n\nSaludos,\nEquipo EPIC-Q',
    variables: ['coordinator_name', 'hospital_name', 'period_number', 'start_date', 'end_date'],
    is_active: true,
    usage_count: 12
  },
  {
    id: generateId(50004),
    name: 'Seguimiento baja completitud',
    category: 'quality',
    subject: 'Seguimiento: Baja completitud de casos - {{hospital_name}}',
    body: 'Estimado/a {{coordinator_name}},\n\nHemos notado que el hospital {{hospital_name}} tiene una completitud de casos del {{completion_percentage}}%, que está por debajo del objetivo del 70%.\n\nCasos creados: {{cases_created}}\nCasos completos: {{cases_completed}}\n\nPor favor, revise los casos pendientes.\n\nSaludos,\nEquipo de Calidad EPIC-Q',
    variables: ['coordinator_name', 'hospital_name', 'completion_percentage', 'cases_created', 'cases_completed'],
    is_active: true,
    usage_count: 8
  },
  {
    id: generateId(50005),
    name: 'Reporte mensual de avances',
    category: 'operations',
    subject: 'Reporte mensual - {{hospital_name}}',
    body: 'Estimado/a {{coordinator_name}},\n\nAdjuntamos el reporte mensual de avances del hospital {{hospital_name}}.\n\nResumen:\n- Casos creados: {{cases_created}}\n- Casos completos: {{cases_completed}}\n- Completitud: {{completion_percentage}}%\n- Última actividad: {{last_case_date}}\n\nSaludos,\nEquipo EPIC-Q',
    variables: ['coordinator_name', 'hospital_name', 'cases_created', 'cases_completed', 'completion_percentage', 'last_case_date'],
    is_active: true,
    usage_count: 6
  }
];

// Generar usuarios
export const mockUsers: User[] = [
  {
    id: 'admin-user-id',
    email: 'admin@epicq.com',
    name: 'Administrador EPIC-Q',
    role: 'admin',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'coordinator-1',
    email: 'coordinator1@hospital.com',
    name: 'Dr. María González',
    role: 'coordinator',
    hospital_id: mockHospitals[0].id,
    created_at: '2023-02-01T00:00:00Z'
  }
];

// Generar KPIs del dashboard
export const mockDashboardKPIs: DashboardKPIs = {
  totalHospitals: mockHospitals.length,
  activeHospitals: mockHospitals.filter(h => h.status === 'active_recruiting').length,
  totalCases: mockCaseMetrics.reduce((sum, metric) => sum + metric.cases_created, 0),
  averageCompletion: Math.round(
    mockCaseMetrics.reduce((sum, metric) => sum + metric.completion_percentage, 0) / 
    mockCaseMetrics.length
  ),
  activeAlerts: mockAlerts.filter(a => !a.is_resolved).length
};

// Generar datos para gráficos
export const mockChartData: ChartData[] = Object.entries(
  mockHospitals.reduce((acc, hospital) => {
    acc[hospital.status] = (acc[hospital.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([status, value]) => ({
  name: statusConfig[status as keyof typeof statusConfig]?.label || status,
  value,
  color: getStatusColor(status as keyof typeof statusConfig)
}));

function getStatusColor(status: keyof typeof statusConfig): string {
  const colors = {
    initial_contact: '#fbbf24',
    pending_evaluation: '#f97316',
    ethics_approval_process: '#3b82f6',
    redcap_setup: '#8b5cf6',
    active_recruiting: '#10b981',
    completed: '#6b7280',
    inactive: '#ef4444'
  };
  return colors[status] || '#6b7280';
}

// Generar datos de series temporales para gráficos
export const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2024, i, 1);
  return {
    date: date.toISOString().split('T')[0],
    value: Math.floor(Math.random() * 100) + 50,
    label: date.toLocaleDateString('es-AR', { month: 'short' })
  };
});

// Función para obtener hospital por ID
export const getHospitalById = (id: string): Hospital | undefined => {
  return mockHospitals.find(h => h.id === id);
};

// Función para obtener contactos por hospital
export const getContactsByHospital = (hospitalId: string): Contact[] => {
  return mockContacts.filter(c => c.hospital_id === hospitalId);
};

// Función para obtener progreso por hospital
export const getProgressByHospital = (hospitalId: string): HospitalProgress | undefined => {
  return mockHospitalProgress.find(p => p.hospital_id === hospitalId);
};

// Función para obtener períodos por hospital
export const getPeriodsByHospital = (hospitalId: string): RecruitmentPeriod[] => {
  return mockRecruitmentPeriods.filter(p => p.hospital_id === hospitalId);
};

// Función para obtener métricas por hospital
export const getMetricsByHospital = (hospitalId: string): CaseMetrics[] => {
  return mockCaseMetrics.filter(m => m.hospital_id === hospitalId);
};

// Función para obtener comunicaciones por hospital
export const getCommunicationsByHospital = (hospitalId: string): Communication[] => {
  return mockCommunications.filter(c => c.hospital_id === hospitalId);
};

// Función para obtener alertas por hospital
export const getAlertsByHospital = (hospitalId: string): Alert[] => {
  return mockAlerts.filter(a => a.hospital_id === hospitalId);
};

// Función para obtener casos totales por hospital
export const getCasesByHospital = (hospitalId: string): { created: number; completed: number; completionRate: number } => {
  const hospitalMetrics = mockCaseMetrics.filter(m => m.hospital_id === hospitalId);
  const totalCreated = hospitalMetrics.reduce((sum, m) => sum + m.cases_created, 0);
  const totalCompleted = hospitalMetrics.reduce((sum, m) => sum + m.cases_completed, 0);
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
  
  return {
    created: totalCreated,
    completed: totalCompleted,
    completionRate
  };
};
