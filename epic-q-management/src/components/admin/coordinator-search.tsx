'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Mail, Phone, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  displayName: string;
  lastLogin: string | null;
  created_at: string;
}

interface CoordinatorSearchProps {
  onSelectCoordinator: (coordinator: Coordinator | null) => void;
  onNewCoordinator: () => void;
  selectedCoordinator: Coordinator | null;
  disabled?: boolean;
}

export function CoordinatorSearch({ 
  onSelectCoordinator, 
  onNewCoordinator, 
  selectedCoordinator,
  disabled = false 
}: CoordinatorSearchProps) {
  const [query, setQuery] = useState('');
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar coordinadores
  const searchCoordinators = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setCoordinators([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/coordinators/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setCoordinators(data.coordinators);
      } else {
        setError('Error al buscar coordinadores');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce para evitar muchas consultas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchCoordinators(query.trim());
      } else {
        setCoordinators([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchCoordinators]);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCoordinator = (coordinator: Coordinator) => {
    setQuery(coordinator.displayName);
    setShowResults(false);
    onSelectCoordinator(coordinator);
  };

  const handleNewCoordinator = () => {
    setQuery('');
    setShowResults(false);
    onSelectCoordinator(null);
    onNewCoordinator();
  };

  const handleInputFocus = () => {
    if (coordinators.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    
    // Si se borra el input, limpiar selección
    if (!value.trim()) {
      onSelectCoordinator(null);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar coordinador por nombre o email..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (coordinators.length > 0 || error) && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border">
          {error ? (
            <div className="p-3 text-red-600 text-sm">
              {error}
            </div>
          ) : (
            <>
              {coordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  onClick={() => handleSelectCoordinator(coordinator)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {coordinator.displayName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{coordinator.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Opción para crear nuevo coordinador */}
              <div
                onClick={handleNewCoordinator}
                className="p-3 hover:bg-blue-50 cursor-pointer border-t border-gray-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">
                      Crear nuevo coordinador
                    </p>
                    <p className="text-xs text-gray-500">
                      Invitar a "{query}" como nuevo coordinador
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Coordinador seleccionado */}
      {selectedCoordinator && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {selectedCoordinator.displayName}
              </p>
              <p className="text-xs text-green-600">
                {selectedCoordinator.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                onSelectCoordinator(null);
              }}
              className="text-green-600 hover:text-green-800"
            >
              Cambiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
