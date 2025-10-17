'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, XCircle, Send, Settings } from 'lucide-react';

interface EmailConfig {
  configured: boolean;
  config: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
    tls: boolean;
  };
  status: string;
}

interface TestResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  error?: string;
  timestamp: string;
}

export default function EmailDebugPage() {
  const { t } = useTranslations();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // Formulario de prueba
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('🧪 Prueba de Email - EPIC-Q');
  const [testMessage, setTestMessage] = useState('Este es un email de prueba del sistema EPIC-Q Management.');

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/debug/email');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      alert('Por favor ingresa un email de destino');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/debug/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          message: testMessage
        })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestResult({
        success: false,
        error: 'Error de conexión',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['admin']}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug de Email</h1>
          <p className="text-gray-600 mt-2">
            Monitorea y prueba la configuración de email del sistema
          </p>
        </div>

        {/* Estado de Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Estado de Configuración
            </CardTitle>
            <CardDescription>
              Verifica si el servicio de email está configurado correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {config.configured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge variant={config.configured ? 'default' : 'destructive'}>
                    {config.configured ? 'Configurado' : 'No Configurado'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Host SMTP:</Label>
                    <p className="text-gray-600">{config.config.host}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Puerto:</Label>
                    <p className="text-gray-600">{config.config.port}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Usuario:</Label>
                    <p className="text-gray-600">{config.config.user}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Contraseña:</Label>
                    <p className="text-gray-600">{config.config.pass}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Remitente:</Label>
                    <p className="text-gray-600">{config.config.from}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Seguro:</Label>
                    <p className="text-gray-600">{config.config.secure ? 'Sí' : 'No'}</p>
                  </div>
                </div>

                {!config.configured && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      El servicio de email no está configurado. Ejecuta{' '}
                      <code className="bg-gray-100 px-1 rounded">node scripts/configure-email.js</code>{' '}
                      para configurarlo.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <p className="text-red-500">Error al cargar la configuración</p>
            )}
          </CardContent>
        </Card>

        {/* Prueba de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Prueba de Email
            </CardTitle>
            <CardDescription>
              Envía un email de prueba para verificar que todo funciona correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Email de Destino</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="testSubject">Asunto</Label>
                <Input
                  id="testSubject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="testMessage">Mensaje</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                placeholder="Escribe tu mensaje de prueba aquí..."
              />
            </div>

            <Button 
              onClick={sendTestEmail} 
              disabled={testing || !config?.configured}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Prueba
                </>
              )}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult.success ? (
                    <div>
                      <p className="font-medium">✅ Email enviado exitosamente!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Message ID: {testResult.messageId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Destinatarios: {testResult.accepted?.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Enviado: {new Date(testResult.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">❌ Error al enviar email</p>
                      <p className="text-sm mt-1">{testResult.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
