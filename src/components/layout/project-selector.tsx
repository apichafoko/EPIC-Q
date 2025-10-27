'use client';

import React, { useState } from 'react';
import { ChevronDown, FolderOpen, Check } from 'lucide-react';
import { useProject } from '../../contexts/project-context';
import { Project } from '../../types';

interface ProjectSelectorProps {
  className?: string;
}

export function ProjectSelector({ className = '' }: ProjectSelectorProps) {
  const { currentProject, projects, setCurrentProject, isLoading } = useProject();
  const [isOpen, setIsOpen] = useState(false);

  const handleProjectChange = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
    
    // Recargar la página para actualizar todos los datos
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-100 ${className}`}>
        <FolderOpen className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">Cargando...</span>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-md bg-red-100 ${className}`}>
        <FolderOpen className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">Sin proyecto</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <FolderOpen className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700 truncate max-w-48">
          {currentProject.name}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Proyectos Disponibles
              </div>
              
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No hay proyectos disponibles
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectChange(project)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 truncate">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {currentProject.id === project.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

