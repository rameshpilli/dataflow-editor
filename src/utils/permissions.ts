
import { useAuth } from '@/contexts/AuthContext';

// Permission constants
export const PERMISSIONS = {
  VIEW_DATA: 'view_data',
  EDIT_DATA: 'edit_data',
  MANAGE_USERS: 'manage_users',
  CONNECT_ADLS: 'connect_adls'
};

// Map permissions to required groups
export const PERMISSION_GROUPS = {
  [PERMISSIONS.VIEW_DATA]: ['Users'],
  [PERMISSIONS.EDIT_DATA]: ['DataEditors', 'Administrators'],
  [PERMISSIONS.MANAGE_USERS]: ['Administrators'],
  [PERMISSIONS.CONNECT_ADLS]: ['ADLSUsers', 'Administrators']
};

// Check if a user has a specific permission
export const hasPermission = (
  user: { role?: string; groups?: string[] } | null, 
  permission: string
): boolean => {
  if (!user) return false;
  
  // Admins have all permissions
  if (user.role === 'admin') return true;
  
  // Get the required groups for this permission
  const requiredGroups = PERMISSION_GROUPS[permission] || [];
  
  // If no specific groups are required, return true
  if (requiredGroups.length === 0) return true;
  
  // Check if user belongs to any required group
  return user.groups ? requiredGroups.some(group => user.groups?.includes(group)) : false;
};

// Custom hook for checking permissions
export const usePermissions = () => {
  const { user, isAuthorized } = useAuth();
  
  return {
    can: (permission: string) => hasPermission(user, permission),
    isAdmin: user?.role === 'admin',
    hasGroup: (group: string) => isAuthorized([group])
  };
};
