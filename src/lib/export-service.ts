export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
}

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
}

export class ExportService {
  static exportToCSV(data: ExportData, filename: string = 'export.csv'): void {
    const { headers, rows } = data;
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportToExcel(data: ExportData, filename: string = 'export.xlsx'): void {
    // Para Excel necesitaríamos una librería como xlsx
    // Por ahora exportamos como CSV con extensión .xlsx
    this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }

  static exportToPDF(data: ExportData, filename: string = 'export.pdf'): void {
    // Para PDF necesitaríamos una librería como jsPDF
    // Por ahora exportamos como CSV
    this.exportToCSV(data, filename.replace('.pdf', '.csv'));
  }

  static exportHospitals(hospitals: any[]): void {
    const data: ExportData = {
      headers: ['Hospital', 'Ubicación', 'Períodos Requeridos', 'Estado', 'Fecha de Ingreso'],
      rows: hospitals.map(h => [
        h.hospital.name,
        h.hospital.city && h.hospital.province 
          ? `${h.hospital.city}, ${h.hospital.province}`
          : 'No especificada',
        h.required_periods,
        h.status,
        new Date(h.joined_at).toLocaleDateString()
      ])
    };

    this.exportToCSV(data, `hospitales-${new Date().toISOString().split('T')[0]}.csv`);
  }

  static exportCoordinators(coordinators: any[]): void {
    const data: ExportData = {
      headers: ['Nombre', 'Email', 'Hospital', 'Rol', 'Estado', 'Fecha de Invitación'],
      rows: coordinators.map(c => [
        c.user.name,
        c.user.email,
        c.hospital.name,
        c.role,
        c.accepted_at ? 'Aceptado' : 'Pendiente',
        new Date(c.invited_at).toLocaleDateString()
      ])
    };

    this.exportToCSV(data, `coordinadores-${new Date().toISOString().split('T')[0]}.csv`);
  }
}
