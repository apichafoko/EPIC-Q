import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  fields: ExportField[];
  format: 'csv' | 'excel' | 'pdf';
}

export interface ExportField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  width?: number;
}

export interface ExportData {
  headers: string[];
  rows: (string | number | boolean)[][];
  metadata?: {
    title: string;
    description?: string;
    generatedAt: Date;
    totalRows: number;
  };
}

export class AdvancedExportService {
  private static templates: ExportTemplate[] = [
    {
      id: 'hospitals-basic',
      name: 'Hospitales Básico',
      description: 'Información básica de hospitales',
      format: 'excel',
      fields: [
        { key: 'name', label: 'Nombre', type: 'text', required: true, width: 30 },
        { key: 'city', label: 'Ciudad', type: 'text', required: false, width: 20 },
        { key: 'province', label: 'Provincia', type: 'text', required: false, width: 20 },
        { key: 'status', label: 'Estado', type: 'text', required: true, width: 15 },
        { key: 'required_periods', label: 'Períodos Requeridos', type: 'number', required: true, width: 20 },
        { key: 'joined_at', label: 'Fecha de Ingreso', type: 'date', required: true, width: 20 }
      ]
    },
    {
      id: 'hospitals-detailed',
      name: 'Hospitales Detallado',
      description: 'Información completa de hospitales con capacidades',
      format: 'excel',
      fields: [
        { key: 'name', label: 'Nombre', type: 'text', required: true, width: 30 },
        { key: 'city', label: 'Ciudad', type: 'text', required: false, width: 20 },
        { key: 'province', label: 'Provincia', type: 'text', required: false, width: 20 },
        { key: 'num_beds', label: 'Camas', type: 'number', required: false, width: 15 },
        { key: 'num_operating_rooms', label: 'Quirófanos', type: 'number', required: false, width: 15 },
        { key: 'num_icu_beds', label: 'Camas UCI', type: 'number', required: false, width: 15 },
        { key: 'avg_weekly_surgeries', label: 'Cirugías/Semana', type: 'number', required: false, width: 20 },
        { key: 'has_residency_program', label: 'Programa Residencia', type: 'boolean', required: false, width: 20 },
        { key: 'has_ethics_committee', label: 'Comité Ética', type: 'boolean', required: false, width: 20 },
        { key: 'university_affiliated', label: 'Afiliado Universitario', type: 'boolean', required: false, width: 25 }
      ]
    },
    {
      id: 'coordinators-basic',
      name: 'Coordinadores Básico',
      description: 'Información básica de coordinadores',
      format: 'excel',
      fields: [
        { key: 'name', label: 'Nombre', type: 'text', required: true, width: 30 },
        { key: 'email', label: 'Email', type: 'text', required: true, width: 35 },
        { key: 'hospital_name', label: 'Hospital', type: 'text', required: true, width: 30 },
        { key: 'role', label: 'Rol', type: 'text', required: true, width: 15 },
        { key: 'status', label: 'Estado', type: 'text', required: true, width: 15 },
        { key: 'invited_at', label: 'Fecha Invitación', type: 'date', required: true, width: 20 },
        { key: 'accepted_at', label: 'Fecha Aceptación', type: 'date', required: false, width: 20 }
      ]
    }
  ];

  static getTemplates(): ExportTemplate[] {
    return this.templates;
  }

  static getTemplate(id: string): ExportTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  static async exportToExcel(data: ExportData, template?: ExportTemplate): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de datos
    const worksheet = XLSX.utils.aoa_to_sheet([
      data.headers,
      ...data.rows
    ]);

    // Aplicar estilos si hay template
    if (template) {
      const colWidths = template.fields.map(field => ({ wch: field.width || 15 }));
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Agregar hoja de metadatos si existen
    if (data.metadata) {
      const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Título', data.metadata.title],
        ['Descripción', data.metadata.description || ''],
        ['Generado en', data.metadata.generatedAt.toLocaleString()],
        ['Total de filas', data.metadata.totalRows],
        ['', ''],
        ['Campos incluidos:', ''],
        ...data.headers.map((header, index) => [index + 1, header])
      ]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadatos');
    }

    // Generar archivo
    const filename = `export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  static async exportToPDF(data: ExportData, template?: ExportTemplate): Promise<void> {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Título
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.metadata?.title || 'Exportación de Datos', 20, 30);
    
    // Metadatos
    if (data.metadata) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generado: ${data.metadata.generatedAt.toLocaleString()}`, 20, 45);
      pdf.text(`Total de registros: ${data.metadata.totalRows}`, 20, 50);
    }

    // Calcular ancho de columnas
    const colCount = data.headers.length;
    const colWidth = (pageWidth - 40) / colCount;
    const rowHeight = 8;
    const startY = 60;
    let currentY = startY;

    // Headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    data.headers.forEach((header, index) => {
      const x = 20 + (index * colWidth);
      pdf.text(header, x, currentY);
    });
    currentY += rowHeight;

    // Línea separadora
    pdf.line(20, currentY, pageWidth - 20, currentY);
    currentY += 5;

    // Datos
    pdf.setFont('helvetica', 'normal');
    data.rows.forEach((row, rowIndex) => {
      // Verificar si necesitamos nueva página
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = 20;
      }

      row.forEach((cell, colIndex) => {
        const x = 20 + (colIndex * colWidth);
        const cellValue = this.formatCellValue(cell, template?.fields[colIndex]?.type);
        pdf.text(cellValue, x, currentY);
      });
      currentY += rowHeight;
    });

    // Guardar archivo
    const filename = `export-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  static async exportTableToPDF(tableElement: HTMLElement, title: string = 'Tabla'): Promise<void> {
    const canvas = await html2canvas(tableElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (imgHeight > pageHeight - 20) {
      // Si la imagen es muy alta, escalarla
      const scaledHeight = pageHeight - 20;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      pdf.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }

    const filename = `${title}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  private static formatCellValue(value: any, type?: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : String(value);
      case 'boolean':
        return value ? 'Sí' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value);
      default:
        return String(value);
    }
  }

  static createCustomTemplate(
    name: string,
    description: string,
    fields: ExportField[],
    format: 'csv' | 'excel' | 'pdf'
  ): ExportTemplate {
    const template: ExportTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      fields,
      format
    };
    
    this.templates.push(template);
    return template;
  }
}
