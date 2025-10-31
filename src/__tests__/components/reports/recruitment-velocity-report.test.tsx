import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RecruitmentVelocityReport } from '@/components/reports/recruitment-velocity-report';

global.fetch = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RecruitmentVelocityReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el componente', () => {
    render(
      <RecruitmentVelocityReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    expect(screen.getByText(/Velocidad de Reclutamiento/i)).toBeInTheDocument();
  });

  it('debe mostrar datos cuando se cargan', async () => {
    const mockData = [
      {
        date: '2024-01-01',
        casesCreated: 10,
        cumulativeCases: 10,
        velocity: 10.5,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockData,
      }),
    });

    render(
      <RecruitmentVelocityReport
        projects={[]}
        hospitals={[]}
        provinces={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Velocidad Promedio/i)).toBeInTheDocument();
    });
  });
});

