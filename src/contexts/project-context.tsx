'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '../types';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  loadProjects: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero obtener información del usuario para determinar el endpoint correcto
      const userResponse = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!userResponse.ok) {
        // Si no está autenticado, limpiar proyectos
        setProjects([]);
        setCurrentProject(null);
        return;
      }

      const userData = await userResponse.json();
      const userRole = userData.user?.role;

      // Determinar el endpoint según el rol
      const endpoint = userRole === 'admin' ? '/api/admin/projects' : '/api/coordinator/projects';

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Si es 401, el usuario no está autenticado, no es un error crítico
        if (response.status === 401) {
          setProjects([]);
          setCurrentProject(null);
          return;
        }
        
        // Obtener detalles del error
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || 'Error desconocido';
        } catch {
          errorDetails = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('Error loading projects:', {
          status: response.status,
          statusText: response.statusText,
          details: errorDetails
        });
        
        throw new Error(`Error al cargar proyectos: ${errorDetails}`);
      }

      const data = await response.json();
      
      setProjects(data.projects || []);

      // Si no hay proyecto actual seleccionado, seleccionar el más reciente
      if (!currentProject && data.projects && data.projects.length > 0) {
        const mostRecentProject = data.projects.sort((a: Project, b: Project) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setCurrentProject(mostRecentProject);
        
        // Persistir en localStorage
        localStorage.setItem('currentProject', JSON.stringify(mostRecentProject));
      } else if (data.projects && data.projects.length === 0) {
        // Si no hay proyectos, limpiar el proyecto actual
        setCurrentProject(null);
        localStorage.removeItem('currentProject');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // En caso de error, limpiar proyectos
      setProjects([]);
      setCurrentProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrentProject = (project: Project) => {
    setCurrentProject(project);
    localStorage.setItem('currentProject', JSON.stringify(project));
  };

  // Cargar proyecto desde localStorage al inicializar
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        setCurrentProject(parsedProject);
      } catch (err) {
        console.error('Error parsing saved project:', err);
        localStorage.removeItem('currentProject');
      }
    }
  }, []);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    // Esperar un poco para que el AuthContext se inicialice
    const timer = setTimeout(() => {
      loadProjects();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const value: ProjectContextType = {
    currentProject,
    projects,
    setCurrentProject: handleSetCurrentProject,
    loadProjects,
    isLoading,
    error,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

