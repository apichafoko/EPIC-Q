'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  showHelp?: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const router = useRouter();
  const { shortcuts, enabled = true, showHelp = true } = config;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar si está escribiendo en un input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const pressedKey = event.key.toLowerCase();
    const isCtrl = event.ctrlKey || event.metaKey; // metaKey para Mac
    const isAlt = event.altKey;
    const isShift = event.shiftKey;

    // Buscar shortcut que coincida
    const matchingShortcut = shortcuts.find(shortcut => {
      const shortcutKey = shortcut.key.toLowerCase();
      return (
        shortcutKey === pressedKey &&
        !!shortcut.ctrlKey === isCtrl &&
        !!shortcut.altKey === isAlt &&
        !!shortcut.shiftKey === isShift
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }

    // Shortcut global para mostrar ayuda (Ctrl+?)
    if (pressedKey === '?' && isCtrl && showHelp) {
      event.preventDefault();
      showShortcutsHelp(shortcuts);
    }
  }, [shortcuts, enabled, showHelp]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts,
    showHelp: () => showShortcutsHelp(shortcuts)
  };
}

// Shortcuts predefinidos para la aplicación
export const createAppShortcuts = (router: any): KeyboardShortcut[] => [
  // Navegación
  {
    key: 'h',
    ctrlKey: true,
    action: () => router.push('/es/admin'),
    description: 'Ir al Dashboard',
    category: 'Navegación'
  },
  {
    key: 'p',
    ctrlKey: true,
    action: () => router.push('/es/admin/projects'),
    description: 'Ir a Proyectos',
    category: 'Navegación'
  },
  {
    key: 'u',
    ctrlKey: true,
    action: () => router.push('/es/admin/users'),
    description: 'Ir a Usuarios',
    category: 'Navegación'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: () => router.push('/es/admin/audit'),
    description: 'Ir a Auditoría',
    category: 'Navegación'
  },

  // Acciones generales
  {
    key: 'n',
    ctrlKey: true,
    action: () => {
      // Buscar botón de "Nuevo" en la página actual
      const newButton = document.querySelector('[data-shortcut="new"]') as HTMLButtonElement;
      if (newButton) {
        newButton.click();
      }
    },
    description: 'Crear nuevo elemento',
    category: 'Acciones'
  },
  {
    key: 's',
    ctrlKey: true,
    action: () => {
      // Buscar botón de "Guardar" en la página actual
      const saveButton = document.querySelector('[data-shortcut="save"]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.click();
      }
    },
    description: 'Guardar cambios',
    category: 'Acciones'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      // Buscar campo de búsqueda en la página actual
      const searchInput = document.querySelector('[data-shortcut="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Buscar',
    category: 'Acciones'
  },
  {
    key: 'Escape',
    action: () => {
      // Cerrar modales o cancelar acciones
      const cancelButton = document.querySelector('[data-shortcut="cancel"]') as HTMLButtonElement;
      const closeButton = document.querySelector('[data-shortcut="close"]') as HTMLButtonElement;
      if (cancelButton) {
        cancelButton.click();
      } else if (closeButton) {
        closeButton.click();
      }
    },
    description: 'Cancelar/Cerrar',
    category: 'Acciones'
  },

  // Navegación en tablas
  {
    key: 'ArrowUp',
    ctrlKey: true,
    action: () => {
      const table = document.querySelector('table');
      if (table) {
        const currentRow = table.querySelector('tr[data-selected="true"]');
        if (currentRow) {
          const prevRow = currentRow.previousElementSibling as HTMLTableRowElement;
          if (prevRow) {
            currentRow.removeAttribute('data-selected');
            prevRow.setAttribute('data-selected', 'true');
            prevRow.scrollIntoView({ block: 'nearest' });
          }
        }
      }
    },
    description: 'Fila anterior en tabla',
    category: 'Navegación'
  },
  {
    key: 'ArrowDown',
    ctrlKey: true,
    action: () => {
      const table = document.querySelector('table');
      if (table) {
        const currentRow = table.querySelector('tr[data-selected="true"]');
        if (currentRow) {
          const nextRow = currentRow.nextElementSibling as HTMLTableRowElement;
          if (nextRow) {
            currentRow.removeAttribute('data-selected');
            nextRow.setAttribute('data-selected', 'true');
            nextRow.scrollIntoView({ block: 'nearest' });
          }
        }
      }
    },
    description: 'Fila siguiente en tabla',
    category: 'Navegación'
  },

  // Acciones de tabla
  {
    key: 'Enter',
    action: () => {
      const selectedRow = document.querySelector('tr[data-selected="true"]');
      if (selectedRow) {
        const viewButton = selectedRow.querySelector('[data-action="view"]') as HTMLButtonElement;
        if (viewButton) {
          viewButton.click();
        }
      }
    },
    description: 'Ver detalles del elemento seleccionado',
    category: 'Acciones'
  },
  {
    key: 'e',
    action: () => {
      const selectedRow = document.querySelector('tr[data-selected="true"]');
      if (selectedRow) {
        const editButton = selectedRow.querySelector('[data-action="edit"]') as HTMLButtonElement;
        if (editButton) {
          editButton.click();
        }
      }
    },
    description: 'Editar elemento seleccionado',
    category: 'Acciones'
  },
  {
    key: 'Delete',
    action: () => {
      const selectedRow = document.querySelector('tr[data-selected="true"]');
      if (selectedRow) {
        const deleteButton = selectedRow.querySelector('[data-action="delete"]') as HTMLButtonElement;
        if (deleteButton) {
          deleteButton.click();
        }
      }
    },
    description: 'Eliminar elemento seleccionado',
    category: 'Acciones'
  }
];

// Función para mostrar ayuda de shortcuts
function showShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  const categories = [...new Set(shortcuts.map(s => s.category))];
  
  let helpText = '🎹 Atajos de Teclado Disponibles:\n\n';
  
  categories.forEach(category => {
    helpText += `📁 ${category}:\n`;
    const categoryShortcuts = shortcuts.filter(s => s.category === category);
    categoryShortcuts.forEach(shortcut => {
      const keys = [];
      if (shortcut.ctrlKey) keys.push('Ctrl');
      if (shortcut.altKey) keys.push('Alt');
      if (shortcut.shiftKey) keys.push('Shift');
      keys.push(shortcut.key.toUpperCase());
      
      helpText += `  ${keys.join(' + ')} - ${shortcut.description}\n`;
    });
    helpText += '\n';
  });

  helpText += '💡 Presiona Ctrl+? para mostrar esta ayuda en cualquier momento.';

  // Crear modal de ayuda
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Atajos de Teclado</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <pre class="text-sm text-gray-700 whitespace-pre-wrap">${helpText}</pre>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cerrar con Escape
  const closeModal = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeModal);
    }
  };
  document.addEventListener('keydown', closeModal);
}
