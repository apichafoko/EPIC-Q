'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, X, Filter } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { GlobalSearchService, SearchResult, SearchFilters } from '../../lib/global-search-service';

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({ 
  placeholder = "Buscar en todos los proyectos...", 
  className = "",
  onResultClick
}: GlobalSearchProps) {
  // Hooks deben estar siempre en el mismo orden
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [shortcutKey, setShortcutKey] = useState('Ctrl+K');
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar historial al montar y determinar shortcut key (solo en cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      GlobalSearchService.loadSearchHistory();
      // Determinar shortcut key una vez en el cliente
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setShortcutKey(isMac ? '⌘K' : 'Ctrl+K');
    }
  }, []);

  // Búsqueda con debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await GlobalSearchService.search(searchQuery, filters, 10);
      setResults(searchResults);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        search(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  // Sugerencias cuando no hay query
  useEffect(() => {
    let isMounted = true;
    
    const loadSuggestions = async () => {
      try {
        const sugg = await GlobalSearchService.getSuggestions(query || '');
        if (isMounted) {
          setSuggestions(sugg);
        }
      } catch (error) {
        console.error('Error cargando sugerencias:', error);
        if (isMounted) {
          // Fallback a historial local si falla la API
          setSuggestions(GlobalSearchService.getSearchHistory().slice(0, 5));
        }
      }
    };
    
    loadSuggestions();
    
    return () => {
      isMounted = false;
    };
  }, [query]);

  // Atajo de teclado Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K o Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      // Escape para cerrar
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(result.url);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const formatResult = (result: SearchResult) => {
    const { icon, typeLabel, highlight } = GlobalSearchService.formatSearchResult(result);
    
    return (
      <div
        key={`${result.type}-${result.id}`}
        className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
        onClick={() => handleResultClick(result)}
      >
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              <span dangerouslySetInnerHTML={{ __html: highlight }} />
            </h4>
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
          </div>
          <p 
            className="text-xs text-gray-500 truncate mt-1"
            dangerouslySetInnerHTML={{ 
              __html: result.highlighted?.description || result.description 
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-6 w-6 p-0"
            aria-label="Filtros"
          >
            <Filter className="h-3 w-3" />
          </Button>
          {!query && (
            <kbd className="hidden sm:inline-flex h-6 px-1.5 items-center gap-1 rounded border bg-background font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span>{shortcutKey}</span>
            </kbd>
          )}
        </div>
      </div>

      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-hidden shadow-lg bg-card text-foreground">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Buscando...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map(formatResult)}
              </div>
            ) : query ? (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No se encontraron resultados para "{query}"</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="p-2">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  <span>Búsquedas recientes</span>
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 hover:bg-accent cursor-pointer rounded"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-foreground">{suggestion}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Escribe para buscar en todos los proyectos</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
