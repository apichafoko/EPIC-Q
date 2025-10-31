import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HospitalProgressReport } from '@/components/reports/hospital-progress-report';

// Mock de fetch
global.fetch = jest.fn();

// Mock de toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('HospitalProgressReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el componente', () => {
    render(
      <HospitalProgressReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    expect(screen.getByText(/Estado de Avance por Hospital/i)).toBeInTheDocument();
  });

  it('debe mostrar skeleton mientras carga', () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // Promise que nunca se resuelve
    );

    render(
      <HospitalProgressReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    // Verificar que el componente está en estado de carga
    // (los skeletons se renderizan pero no tienen testId, así que verificamos por clase)
    const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('debe cargar y mostrar datos', async () => {
    const mockData = [
      {
        hospitalId: 'h1',
        hospitalName: 'Hospital Test',
        province: 'Buenos Aires',
        progressPercentage: 75,
        casesCreated: 75,
        completionPercentage: 80,
        status: 'active',
        ethicsSubmitted: true,
        ethicsApproved: true,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockData,
      }),
    });

    render(
      <HospitalProgressReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hospital Test')).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay datos', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(
      <HospitalProgressReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay datos disponibles/i)).toBeInTheDocument();
    });
  });
});

