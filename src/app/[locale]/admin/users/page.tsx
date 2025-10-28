'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../../../hooks/useTranslations';
import { toast } from 'sonner';
import { AuthGuard } from '../../../../components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { LoadingButton } from '../../../../components/ui/loading-button';
import { useLoadingState } from '../../../../hooks/useLoadingState';
import { Checkbox } from '../../../../components/ui/checkbox';
import { BulkActions } from '../../../../components/ui/bulk-actions';
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
  User,
  CheckSquare,
  Square
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);
  
  // Estados para bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDeactivateModal, setShowBulkDeactivateModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Estados de carga usando el hook personalizado
  const { isLoading: isResending, executeWithLoading: executeWithResending } = useLoadingState();
  const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();
  const { isLoading: isReactivating, executeWithLoading: executeWithReactivating } = useLoadingState();
  const { isLoading: isDeactivating, executeWithLoading: executeWithDeactivating } = useLoadingState();
  const { isLoading: isBulkDeactivating, executeWithLoading: executeWithBulkDeactivating } = useLoadingState();
  const { isLoading: isBulkDeleting, executeWithLoading: executeWithBulkDeleting } = useLoadingState();

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
    await executeWithResending(async () => {
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
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeactivateUser = (userToDeactivate: User) => {
    // Verificar si el usuario admin está intentando desactivarse a sí mismo
    if (userToDeactivate.id === user?.id) {
      toast.error('No puedes desactivarte a ti mismo', {
        description: 'Para desactivar tu cuenta de administrador, contacta al soporte técnico.'
      });
      return;
    }
    
    setUserToDeactivate(userToDeactivate);
    setShowDeactivateModal(true);
  };

  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;

    await executeWithDeactivating(async () => {
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
        // Cerrar modal
        setShowDeactivateModal(false);
        setUserToDeactivate(null);
      } else {
        toast.error('Error al desactivar el usuario', {
          description: data.details || data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  const handleDeleteUser = (userToDelete: User) => {
    // Verificar si el usuario admin está intentando eliminarse a sí mismo
    if (userToDelete.id === user?.id) {
      toast.error('No puedes eliminarte a ti mismo', {
        description: 'Para eliminar tu cuenta de administrador, contacta al soporte técnico.'
      });
      return;
    }
    
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    await executeWithDeleting(async () => {
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
        // Solo cerrar el modal si fue exitoso
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        // Verificar si necesita confirmación de cascada
        if (data.requiresConfirmation) {
          setShowDeleteModal(false);
          toast.info('Se requieren acciones adicionales', {
            description: data.message || 'Hay efectos en cascada que deben confirmarse'
          });
          console.log('Acciones en cascada:', data);
        } else {
          toast.error('Error al eliminar el usuario', {
            description: data.details || data.error || 'Inténtalo de nuevo más tarde'
          });
        }
      }
    });
  };

  const handleReactivateUser = (user: User) => {
    setUserToReactivate(user);
    setShowReactivateModal(true);
  };

  const confirmReactivateUser = async () => {
    if (!userToReactivate) return;

    await executeWithReactivating(async () => {
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
        // Cerrar modal
        setShowReactivateModal(false);
        setUserToReactivate(null);
      } else {
        toast.error('Error al reactivar el usuario', {
          description: data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  // Funciones para bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Excluir al usuario admin actual de la selección
      setSelectedUsers(filteredUsers.filter(u => u.id !== user?.id).map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    // No permitir seleccionar al usuario admin actual
    if (userId === user?.id) {
      toast.error('No puedes seleccionarte a ti mismo', {
        description: 'Para gestionar tu cuenta de administrador, contacta al soporte técnico.'
      });
      return;
    }
    
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) return;
    
    // Verificar si el usuario admin está intentando desactivarse a sí mismo
    if (selectedUsers.includes(user?.id || '')) {
      toast.error('No puedes desactivarte a ti mismo', {
        description: 'Para desactivar tu cuenta de administrador, contacta al soporte técnico.'
      });
      return;
    }
    
    setShowBulkDeactivateModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    
    // Verificar si el usuario admin está intentando eliminarse a sí mismo
    if (selectedUsers.includes(user?.id || '')) {
      toast.error('No puedes eliminarte a ti mismo', {
        description: 'Para eliminar tu cuenta de administrador, contacta al soporte técnico.'
      });
      return;
    }
    
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;

    await executeWithBulkDeactivating(async () => {
      const response = await fetch('/api/admin/users/bulk-deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`${selectedUsers.length} usuarios desactivados exitosamente`, {
          description: 'Los usuarios ya no podrán acceder al sistema'
        });
        // Recargar la lista de usuarios
        loadUsers();
        // Limpiar selección y cerrar modal
        setSelectedUsers([]);
        setShowBulkDeactivateModal(false);
      } else {
        toast.error('Error al desactivar usuarios', {
          description: data.details || data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    await executeWithBulkDeleting(async () => {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`${selectedUsers.length} usuarios eliminados permanentemente`, {
          description: 'Todos los datos de los usuarios han sido borrados de la base de datos'
        });
        // Recargar la lista de usuarios
        loadUsers();
        // Limpiar selección y cerrar modal
        setSelectedUsers([]);
        setShowBulkDeleteModal(false);
      } else {
        toast.error('Error al eliminar usuarios', {
          description: data.details || data.error || 'Inténtalo de nuevo más tarde'
        });
      }
    });
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

  const getStatusBadge = (isActive: boolean, userId: string) => {
    return (
      <div className="flex items-center space-x-2">
        {isActive ? 
          <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge> :
          <Badge variant="secondary">Inactivo</Badge>
        }
        {userId === user?.id && (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Tu cuenta
          </Badge>
        )}
      </div>
    );
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
            <>
              {/* Bulk Actions Bar */}
              {selectedUsers.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDeactivate}
                        disabled={isBulkDeactivating}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Desactivar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos los usuarios"
                      />
                    </TableHead>
                    <TableHead>{t('users.table.user')}</TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.hospital')}</TableHead>
                    <TableHead>{t('users.table.status')}</TableHead>
                    <TableHead>{t('users.table.lastAccess')}</TableHead>
                    <TableHead className="text-right">{t('users.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className={u.id === user?.id ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={(checked) => handleSelectUser(u.id, checked as boolean)}
                        disabled={u.id === user?.id}
                        aria-label={`Seleccionar ${u.name || u.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{u.name || t('users.table.noName')}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.hospital_name || t('users.table.unassigned')}
                    </TableCell>
                    <TableCell>{getStatusBadge(u.isActive, u.id)}</TableCell>
                    <TableCell>
                      {u.lastLogin ? 
                        new Date(u.lastLogin).toLocaleDateString() : 
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
                          <DropdownMenuItem onClick={() => handleEditUser(u)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('users.table.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleResendInvitation(u.id)}
                            disabled={isResending}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {isResending ? t('users.table.sending') : t('users.table.resendInvitation')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.isActive ? (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeactivateUser(u)}
                              disabled={isDeactivating || u.id === user?.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeactivating ? 'Desactivando...' : t('users.table.deactivate')}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleReactivateUser(u)}
                                disabled={isReactivating}
                              >
                                <User className="h-4 w-4 mr-2" />
                                {isReactivating ? 'Reactivando...' : t('users.table.reactivate')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-700 font-semibold"
                                onClick={() => handleDeleteUser(u)}
                                disabled={isDeleting || u.id === user?.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? 'Eliminando...' : t('users.table.delete')}
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
            </>
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
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                {t('users.confirmDeactivate.title')}
              </h3>
              <p className="text-sm text-gray-500 mb-4 text-center">
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
              <div className="flex gap-3 justify-end items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setUserToDeactivate(null);
                  }}
                  disabled={isDeactivating}
                >
                  {t('users.confirmDeactivate.cancel')}
                </Button>
                <LoadingButton
                  variant="default"
                  onClick={confirmDeactivateUser}
                  loading={isDeactivating}
                  loadingText={t('users.confirmDeactivate.deactivating')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('users.confirmDeactivate.confirm')}
                </LoadingButton>
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
              <div className="flex gap-3 justify-end items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  {t('users.confirmDelete.cancel')}
                </Button>
                <LoadingButton
                  variant="default"
                  onClick={confirmDeleteUser}
                  loading={isDeleting}
                  loadingText={t('users.confirmDelete.deleting')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('users.confirmDelete.confirm')}
                </LoadingButton>
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
              <div className="flex gap-3 justify-end items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReactivateModal(false);
                    setUserToReactivate(null);
                  }}
                  disabled={isReactivating}
                >
                  {t('users.confirmReactivate.cancel')}
                </Button>
                <LoadingButton
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={confirmReactivateUser}
                  loading={isReactivating}
                  loadingText={t('users.confirmReactivate.reactivating')}
                >
                  {t('users.confirmReactivate.confirm')}
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deactivate Confirmation Modal */}
      {showBulkDeactivateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Desactivar Múltiples Usuarios
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Estás seguro de que quieres desactivar {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''}?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  ⚠️ Acción Reversible
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Los usuarios no podrán acceder al sistema, pero pueden ser reactivados posteriormente.
                </p>
              </div>
              <div className="flex gap-3 justify-end items-center">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeactivateModal(false)}
                  disabled={isBulkDeactivating}
                >
                  Cancelar
                </Button>
                <LoadingButton
                  variant="default"
                  onClick={confirmBulkDeactivate}
                  loading={isBulkDeactivating}
                  loadingText="Desactivando..."
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Desactivar {selectedUsers.length} Usuario{selectedUsers.length !== 1 ? 's' : ''}
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Eliminar Múltiples Usuarios Permanentemente
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Estás seguro de que quieres eliminar permanentemente {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''}?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Acción Irreversible
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Se borrará toda la información de los usuarios de la base de datos. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 justify-end items-center">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                >
                  Cancelar
                </Button>
                <LoadingButton
                  variant="default"
                  onClick={confirmBulkDelete}
                  loading={isBulkDeleting}
                  loadingText="Eliminando..."
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Eliminar {selectedUsers.length} Usuario{selectedUsers.length !== 1 ? 's' : ''}
                </LoadingButton>
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
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{id: string, name: string, city: string, province: string}>>([]);

  useEffect(() => {
    // Cargar hospitales si es coordinador
    if (formData.role === 'coordinator') {
      setLoadingHospitals(true);
      fetch('/api/hospitals')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch hospitals');
          }
          return res.json();
        })
        .then(data => setHospitals(data.hospitals || []))
        .catch(error => {
          console.error('Error loading hospitals:', error);
          toast.error('Error al cargar los hospitales');
        })
        .finally(() => setLoadingHospitals(false));
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
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as "admin" | "coordinator", hospital_id: '' }))}
              className="w-full border rounded-lg px-3 py-2"
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
                className="w-full border rounded-lg px-3 py-2"
                required
                disabled={loadingHospitals}
              >
                <option value="">{loadingHospitals ? 'Cargando hospitales...' : 'Seleccionar hospital'}</option>
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
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
