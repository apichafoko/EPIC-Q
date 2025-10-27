'use client';

import { useAuth } from '../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'email' | 'both';
  internal_subject?: string;
  internal_body?: string;
  email_subject?: string;
  email_body?: string;
  category?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function TemplatesDebugPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Debug page useEffect - authLoading:', authLoading, 'user:', user);
    
    if (authLoading) {
      console.log('Still loading auth...');
      return;
    }
    
    if (!user) {
      console.log('No user, redirecting to login');
      router.push('/es/auth/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('User is not admin, redirecting to coordinator');
      router.push('/es/coordinator');
      return;
    }

    console.log('User is admin, loading templates');
    loadTemplates();
  }, [user, authLoading, router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading templates...');
      
      const response = await fetch('/api/templates-debug', {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        setError(`API Error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Templates data:', data);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>No autenticado</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>No tienes permisos de administrador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates Debug</h1>
          <p className="text-gray-600 mt-2">
            Página de debug para templates
          </p>
        </div>
        <Button onClick={loadTemplates}>
          <Plus className="h-4 w-4 mr-2" />
          Recargar Templates
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando templates...</p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="p-3 border rounded">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <p className="text-xs text-gray-500">Tipo: {template.type}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
