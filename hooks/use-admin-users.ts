import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { serverClient, apiUtils } from '@/lib/api/server-api-client';

// Types
export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  username?: string;
  title?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  role: string;
  roleName?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserWithCount extends UserData {
  itemCount: number;
  commentCount: number;
}

export interface CreateUserRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
  title?: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
  title?: string;
  avatar?: string;
}

export interface UsersListResponse {
  success: boolean;
  data: UserWithCount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  message?: string;
}

export interface UsersStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
  };
  error?: string;
  message?: string;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

// Query keys for React Query
const usersQueryKeys = {
  all: ['admin-users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (params: UsersListParams) => [...usersQueryKeys.lists(), params] as const,
  stats: () => [...usersQueryKeys.all, 'stats'] as const,
  details: () => [...usersQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersQueryKeys.details(), id] as const,
};

// API functions
const fetchUsers = async (params: UsersListParams): Promise<UsersListResponse> => {
  const queryString = apiUtils.createQueryString({
    page: params.page?.toString() || '1',
    limit: params.limit?.toString() || '10',
    ...(params.search && { search: params.search }),
    ...(params.role && { role: params.role }),
    ...(params.status && { status: params.status }),
  });
  
  const response = await serverClient.get<UsersListResponse>(`/api/admin/users?${queryString}`);
  
  if (!apiUtils.isSuccess(response)) {
    throw new Error(apiUtils.getErrorMessage(response));
  }
  
  return response.data;
};

const fetchUsersStats = async (): Promise<UsersStatsResponse> => {
  const response = await serverClient.get<UsersStatsResponse>('/api/admin/users/stats');
  
  if (!apiUtils.isSuccess(response)) {
    throw new Error(apiUtils.getErrorMessage(response));
  }
  
  return response.data;
};

const createUser = async (data: CreateUserRequest): Promise<{ user: UserData }> => {
  const response = await serverClient.post<{ user: UserData }>('/api/admin/users', data);
  
  if (!apiUtils.isSuccess(response)) {
    throw new Error(apiUtils.getErrorMessage(response));
  }
  
  return response.data;
};

const updateUser = async (id: string, data: UpdateUserRequest): Promise<{ user: UserData }> => {
  const response = await serverClient.put<{ user: UserData }>(`/api/admin/users/${id}`, data);
  
  if (!apiUtils.isSuccess(response)) {
    throw new Error(apiUtils.getErrorMessage(response));
  }
  
  return response.data;
};

const deleteUser = async (id: string): Promise<void> => {
  const response = await serverClient.delete(`/api/admin/users/${id}`);
  
  if (!apiUtils.isSuccess(response)) {
    throw new Error(apiUtils.getErrorMessage(response));
  }
};

interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface UseAdminUsersReturn {
  // Data
  users: UserWithCount[];
  stats: { total: number; active: number; inactive: number };
  
  // Loading states
  isLoading: boolean;
  isFiltering: boolean;
  isSubmitting: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  
  // Filters
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  
  // Actions
  createUser: (data: CreateUserRequest) => Promise<boolean>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  
  // Pagination actions
  setCurrentPage: (page: number) => void;
  handlePageChange: (page: number) => void;
  
  // Filter actions
  setSearchTerm: (term: string) => void;
  handleSearch: (term: string) => void;
  setRoleFilter: (role: string) => void;
  handleRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  handleStatusFilter: (status: string) => void;
  
  // Utility
  refetch: () => void;
  refreshData: () => void;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}): UseAdminUsersReturn {
  const {
    page: initialPage = 1,
    limit = 10,
    search: initialSearch = '',
    role: initialRole = '',
    status: initialStatus = '',
  } = options;

  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  
  // Query client for cache management
  const queryClient = useQueryClient();

  // React Query hooks
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: usersQueryKeys.list({ 
      page: currentPage, 
      limit, 
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
    queryFn: () => fetchUsers({ 
      page: currentPage, 
      limit, 
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes - reduced from 30 seconds
    retry: 3,
  });

  // Stats query
  const {
    data: statsData,
  } = useQuery({
    queryKey: usersQueryKeys.stats(),
    queryFn: fetchUsersStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes - reduced from 1 minute
    retry: 3,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Derived data
  const users = usersData?.data || [];

  const isFiltering = isLoading && currentPage === 1;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const totalPages = usersData?.totalPages || 1;
  const totalUsers = usersData?.total || 0;
  const stats = statsData?.data || { total: 0, active: 0, inactive: 0 };

  // Wrapper functions for mutations
  const handleCreateUser = useCallback(async (data: CreateUserRequest): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error('Failed to create user:', error);
      return false;
    }
  }, [createMutation]);

  const handleUpdateUser = useCallback(async (id: string, data: UpdateUserRequest): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  }, [updateMutation]);

  const handleDeleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }, [deleteMutation]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  // Handle role filter
  const handleRoleFilter = useCallback((role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  }, []);

  // Handle status filter
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // Refresh all data
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
  }, [queryClient]);

  return {
    // Data
    users,
    stats,
    
    // Loading states
    isLoading,
    isFiltering,
    isSubmitting,
    
    // Pagination
    currentPage,
    totalPages,
    totalUsers,
    
    // Filters
    searchTerm,
    roleFilter,
    statusFilter,
    
    // Actions
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    
    // Pagination actions
    setCurrentPage,
    handlePageChange,
    
    // Filter actions
    setSearchTerm,
    handleSearch,
    setRoleFilter,
    handleRoleFilter,
    setStatusFilter,
    handleStatusFilter,
    
    // Utility
    refetch,
    refreshData,
  };
}
