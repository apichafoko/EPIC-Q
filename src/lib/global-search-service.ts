export interface SearchResult {
  id: string;
  type: 'project' | 'hospital' | 'coordinator' | 'user' | 'alert' | 'communication';
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
  score: number;
  highlighted?: {
    title?: string;
    description?: string;
  };
}

export interface SearchFilters {
  types?: string[];
  projects?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class GlobalSearchService {
  private static searchIndex: Map<string, SearchResult> = new Map();
  private static searchHistory: string[] = [];

  static async search(
    query: string, 
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: query.trim(),
          filters,
          limit
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.addToHistory(query);
        return data.results || [];
      }
    } catch (error) {
      console.error('Error en búsqueda global:', error);
    }

    return [];
  }

  static async searchProjects(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.search(query, { types: ['project'] }, limit);
  }

  static async searchHospitals(query: string, projectId?: string, limit: number = 10): Promise<SearchResult[]> {
    const filters: SearchFilters = { types: ['hospital'] };
    if (projectId) {
      filters.projects = [projectId];
    }
    return this.search(query, filters, limit);
  }

  static async searchCoordinators(query: string, projectId?: string, limit: number = 10): Promise<SearchResult[]> {
    const filters: SearchFilters = { types: ['coordinator'] };
    if (projectId) {
      filters.projects = [projectId];
    }
    return this.search(query, filters, limit);
  }

  static getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  static clearSearchHistory(): void {
    this.searchHistory = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('search_history');
      } catch (error) {
        console.error('Error limpiando historial:', error);
      }
    }
  }

  private static addToHistory(query: string): void {
    if (!query || query.trim().length === 0) return;
    
    // Remover duplicados
    this.searchHistory = this.searchHistory.filter(q => q !== query);
    
    // Agregar al inicio
    this.searchHistory.unshift(query);
    
    // Limitar a 10 elementos
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    // Guardar en localStorage (solo en cliente)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error('Error guardando historial:', error);
      }
    }
  }

  static loadSearchHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const saved = localStorage.getItem('search_history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando historial de búsqueda:', error);
      this.searchHistory = [];
    }
  }

  static async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 1) {
      return this.searchHistory.slice(0, 5);
    }

    // Combinar historial con sugerencias inteligentes
    const historySuggestions = this.searchHistory.filter(term => 
      term.toLowerCase().includes(query.toLowerCase())
    );

    // Intentar obtener sugerencias del servidor
    try {
      const response = await fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: query.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        const serverSuggestions = data.suggestions || [];
        // Combinar y remover duplicados
        const combined = [...new Set([...serverSuggestions, ...historySuggestions])];
        return combined.slice(0, 8);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    }

    return historySuggestions.slice(0, 5);
  }

  static formatSearchResult(result: SearchResult, query?: string): {
    icon: string;
    typeLabel: string;
    highlight: string;
  } {
    const typeConfig: Record<string, { icon: string; label: string }> = {
      project: { icon: '📁', label: 'Proyecto' },
      hospital: { icon: '🏥', label: 'Hospital' },
      coordinator: { icon: '👤', label: 'Coordinador' },
      user: { icon: '👥', label: 'Usuario' },
      alert: { icon: '⚠️', label: 'Alerta' },
      communication: { icon: '📧', label: 'Comunicación' }
    };

    const config = typeConfig[result.type] || { icon: '📄', label: 'Elemento' };

    return {
      icon: config.icon,
      typeLabel: config.label,
      highlight: result.highlighted?.title || this.highlightQuery(result.title, query || '')
    };
  }


  private static highlightQuery(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }
}
