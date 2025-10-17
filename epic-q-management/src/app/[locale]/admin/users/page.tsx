'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Edit, 
  Trash2,
  Shield,
  User
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coordinator';
  hospital_id: string | null;
  hospital_name?: string;
  isActive: boolean;
  lastLogin: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { t } = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<string | null>(null);

      useEffect(() => {
        if (authLoading) return; // Still loading
        
        if (!user) {
          router.push('/es/auth/login');
          return;
        }
        
        if (user.role !== 'admin') {
          router.push('/es/coordinator');
          return;
        }

        loadUsers();
      }, [user, authLoading, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      const response = await fetch('/api/admin/users');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Users data:', data);
      
      if (data.users) {
        setUsers(data.users);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      setResendingInvitation(userId);
      const response = await fetch('/api/admin/users/resend-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Invitación reenviada exitosamente', {
          description: 'El usuario recibirá un nuevo email de invitación'
        });
      } else {
        toast.error('Error al reenviar la invitación', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      });
    } finally {
      setResendingInvitation(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeactivateUser = (user: User) => {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  };

  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;

    try {
      setDeactivatingUser(userToDeactivate.id);
      const response = await fetch(`/api/admin/users/${userToDeactivate.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Usuario desactivado exitosamente', {
          description: 'El usuario ya no podrá acceder al sistema'
        });
        // Recargar la lista de usuarios
        loadUsers();
      } else {
        toast.error('Error al desactivar el usuario', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      });
    } finally {
      setDeactivatingUser(null);
      setShowDeactivateModal(false);
      setUserToDeactivate(null);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUser(userToDelete.id);
      const response = await fetch(`/api/admin/users/${userToDelete.id}/permanent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Usuario eliminado permanentemente', {
          description: 'Todos los datos del usuario han sido borrados de la base de datos'
        });
        // Recargar la lista de usuarios
        loadUsers();
      } else {
        toast.error('Error al eliminar el usuario', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      });
    } finally {
      setDeletingUser(null);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleReactivateUser = (user: User) => {
    setUserToReactivate(user);
    setShowReactivateModal(true);
  };

  const confirmReactivateUser = async () => {
    if (!userToReactivate) return;

    try {
      setReactivatingUser(userToReactivate.id);
      const response = await fetch(`/api/admin/users/${userToReactivate.id}/reactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Usuario reactivado exitosamente', {
          description: 'El usuario ya puede acceder al sistema nuevamente'
        });
        // Recargar la lista de usuarios
        loadUsers();
      } else {
        toast.error('Error al reactivar el usuario', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      });
    } finally {
      setReactivatingUser(null);
      setShowReactivateModal(false);
      setUserToReactivate(null);
    }
  };

      if (authLoading) {
        return (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        );
      }

      if (!user || user.role !== 'admin') {
        return null;
      }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default" className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    return <Badge variant="outline"><User className="h-3 w-3 mr-1" />Coordinador</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge> :
      <Badge variant="secondary">Inactivo</Badge>;
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('users.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('users.subtitle')}
          </p>
        </div>
        <Button onClick={() => router.push('/es/admin/users/new')}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('users.newUser')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users.stats.totalUsers')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users.stats.administrators')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users.stats.coordinators')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'coordinator').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users.stats.activeUsers')}</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>{t('users.filters.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('users.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filters.filterByRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.filters.allRoles')}</SelectItem>
                <SelectItem value="admin">{t('users.filters.administrators')}</SelectItem>
                <SelectItem value="coordinator">{t('users.filters.coordinators')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filters.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('users.filters.active')}</SelectItem>
                <SelectItem value="inactive">{t('users.filters.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.table.title')}</CardTitle>
          <CardDescription>
            {filteredUsers.length} de {users.length} {t('users.table.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('users.table.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.table.user')}</TableHead>
                  <TableHead>{t('users.table.role')}</TableHead>
                  <TableHead>{t('users.table.hospital')}</TableHead>
                  <TableHead>{t('users.table.status')}</TableHead>
                  <TableHead>{t('users.table.lastAccess')}</TableHead>
                  <TableHead className="text-right">{t('users.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name || t('users.table.noName')}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.hospital_name || t('users.table.unassigned')}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                    <TableCell>
                      {user.lastLogin ? 
                        new Date(user.lastLogin).toLocaleDateString() : 
                        t('users.table.never')
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('users.table.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('users.table.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleResendInvitation(user.id)}
                            disabled={resendingInvitation === user.id}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {resendingInvitation === user.id ? t('users.table.sending') : t('users.table.resendInvitation')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isActive ? (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeactivateUser(user)}
                              disabled={deactivatingUser === user.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deactivatingUser === user.id ? 'Desactivando...' : t('users.table.deactivate')}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleReactivateUser(user)}
                                disabled={reactivatingUser === user.id}
                              >
                                <User className="h-4 w-4 mr-2" />
                                {reactivatingUser === user.id ? 'Reactivando...' : t('users.table.reactivate')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-700 font-semibold"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUser === user.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deletingUser === user.id ? 'Eliminando...' : t('users.table.delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSave={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setShowEditModal(false);
            setEditingUser(null);
            toast.success('Usuario actualizado exitosamente');
          }}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && userToDeactivate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('users.confirmDeactivate.title')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('users.confirmDeactivate.message', { name: userToDeactivate.name || userToDeactivate.email })}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  {t('users.confirmDeactivate.info')}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {t('users.confirmDeactivate.infoDesc')}
                </p>
              </div>
              <div className="flex space-x-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setUserToDeactivate(null);
                  }}
                  disabled={deactivatingUser === userToDeactivate.id}
                >
                  {t('users.confirmDeactivate.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeactivateUser}
                  disabled={deactivatingUser === userToDeactivate.id}
                >
                  {deactivatingUser === userToDeactivate.id ? t('users.confirmDeactivate.deactivating') : t('users.confirmDeactivate.confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('users.confirmDelete.title')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('users.confirmDelete.message', { name: userToDelete.name || userToDelete.email })}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  {t('users.confirmDelete.warning')}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {t('users.confirmDelete.warningDesc')}
                </p>
              </div>
              <div className="flex space-x-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={deletingUser === userToDelete.id}
                >
                  {t('users.confirmDelete.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                  disabled={deletingUser === userToDelete.id}
                >
                  {deletingUser === userToDelete.id ? t('users.confirmDelete.deleting') : t('users.confirmDelete.confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && userToReactivate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('users.confirmReactivate.title')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('users.confirmReactivate.message', { name: userToReactivate.name || userToReactivate.email })}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-green-800 font-medium">
                  {t('users.confirmReactivate.info')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {t('users.confirmReactivate.infoDesc')}
                </p>
              </div>
              <div className="flex space-x-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReactivateModal(false);
                    setUserToReactivate(null);
                  }}
                  disabled={reactivatingUser === userToReactivate.id}
                >
                  {t('users.confirmReactivate.cancel')}
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={confirmReactivateUser}
                  disabled={reactivatingUser === userToReactivate.id}
                >
                  {reactivatingUser === userToReactivate.id ? t('users.confirmReactivate.reactivating') : t('users.confirmReactivate.confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}

// Modal para editar usuario
function EditUserModal({ 
  user, 
  onClose, 
  onSave 
}: { 
  user: User; 
  onClose: () => void; 
  onSave: (user: User) => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'coordinator',
    hospital_id: user.hospital_id || '',
    isActive: user.isActive
  });
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{id: string, name: string, city: string, province: string}>>([]);

  useEffect(() => {
    // Cargar hospitales si es coordinador
    if (formData.role === 'coordinator') {
      fetch('/api/hospitals')
        .then(res => res.json())
        .then(data => setHospitals(data.hospitals || []))
        .catch(console.error);
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        onSave(data.user);
      } else {
        toast.error('Error al actualizar el usuario', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value, hospital_id: '' }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="admin">Administrador</option>
              <option value="coordinator">Coordinador</option>
            </select>
          </div>

          {formData.role === 'coordinator' && (
            <div>
              <label className="block text-sm font-medium mb-1">Hospital</label>
              <select
                value={formData.hospital_id}
                onChange={(e) => setFormData(prev => ({ ...prev, hospital_id: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Seleccionar hospital</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.city}, {hospital.province}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm">Usuario activo</label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
