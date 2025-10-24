export interface SearchResult {
  id: string;
  type: 'project' | 'hospital' | 'coordinator' | 'user';
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
  score: number;
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
    localStorage.removeItem('search_history');
  }

  private static addToHistory(query: string): void {
    // Remover duplicados
    this.searchHistory = this.searchHistory.filter(q => q !== query);
    
    // Agregar al inicio
    this.searchHistory.unshift(query);
    
    // Limitar a 10 elementos
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    // Guardar en localStorage
    localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
  }

  static loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('search_history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando historial de búsqueda:', error);
    }
  }

  static getSuggestions(query: string): string[] {
    if (!query || query.length < 1) {
      return this.searchHistory.slice(0, 5);
    }

    const suggestions = this.searchHistory.filter(term => 
      term.toLowerCase().includes(query.toLowerCase())
    );

    return suggestions.slice(0, 5);
  }

  static formatSearchResult(result: SearchResult, query?: string): {
    icon: string;
    typeLabel: string;
    highlight: string;
  } {
    const typeConfig = {
      project: { icon: '📁', label: 'Proyecto' },
      hospital: { icon: '🏥', label: 'Hospital' },
      coordinator: { icon: '👤', label: 'Coordinador' },
      user: { icon: '👥', label: 'Usuario' }
    };

    const config = typeConfig[result.type] || { icon: '📄', label: 'Elemento' };

    return {
      icon: config.icon,
      typeLabel: config.label,
      highlight: this.highlightQuery(result.title, query || '')
    };
  }

  private static highlightQuery(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }
}
