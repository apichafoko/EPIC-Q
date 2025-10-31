import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportFilters } from '@/components/reports/report-filters';

describe('ReportFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el componente', () => {
    render(
      <ReportFilters
        projects={[]}
        hospitals={[]}
        provinces={[]}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/Filtros/i)).toBeInTheDocument();
  });

  it('debe mostrar filtros cuando está expandido', () => {
    render(
      <ReportFilters
        projects={[
          { id: 'p1', name: 'Proyecto 1' },
        ]}
        hospitals={[]}
        provinces={['Buenos Aires']}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Hacer clic en "Mostrar"
    const showButton = screen.getByText(/Mostrar/i);
    fireEvent.click(showButton);

    expect(screen.getByText(/Proyecto/i)).toBeInTheDocument();
    expect(screen.getByText(/Provincia/i)).toBeInTheDocument();
  });

  it('debe llamar onFiltersChange cuando se selecciona un proyecto', () => {
    render(
      <ReportFilters
        projects={[
          { id: 'p1', name: 'Proyecto 1' },
        ]}
        hospitals={[]}
        provinces={[]}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const showButton = screen.getByText(/Mostrar/i);
    fireEvent.click(showButton);

    // Seleccionar proyecto
    const projectSelect = screen.getByRole('combobox', { name: /proyecto/i });
    fireEvent.click(projectSelect);

    const projectOption = screen.getByText('Proyecto 1');
    fireEvent.click(projectOption);

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});

