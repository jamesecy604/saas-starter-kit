import { Role } from '@prisma/client';
import type { Session } from 'next-auth';

export { Role };

type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
export type Resource =
  | 'team'
  | 'team_member'
  | 'team_invitation'
  | 'team_sso'
  | 'team_dsync'
  | 'team_audit_log'
  | 'team_webhook'
  | 'team_payments'
  | 'team_api_key'
  | 'model_management';

export type AccessCheckResult = {
  allowed: boolean;
  message: string;
  status: number;
  resource: Resource;
  action: Action;
};

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

type RoleConfig = {
  id: Role;
  name: string;
  permissions: (Permission | '*')[];
};

export const availableRoles: RoleConfig[] = [
  {
    id: Role.SYSADMIN,
    name: 'System Admin',
    permissions: [
      { resource: 'model_management', actions: '*' }
    ]
  },
  {
    id: Role.MEMBER,
    name: 'Member',
    permissions: [
      { resource: 'team', actions: ['read', 'leave'] },
      { resource: 'team_api_key', actions: '*' }
    ]
  },
  {
    id: Role.ADMIN,
    name: 'Admin',
    permissions: [
      { resource: 'team', actions: ['read', 'leave'] },
      { resource: 'team_api_key', actions: '*' }
    ]
  },
  {
    id: Role.OWNER,
    name: 'Owner',
    permissions: [
      { resource: 'team', actions: '*' },
      { resource: 'team_member', actions: '*' },
      { resource: 'team_invitation', actions: '*' },
      { resource: 'team_sso', actions: '*' },
      { resource: 'team_dsync', actions: '*' },
      { resource: 'team_audit_log', actions: '*' },
      { resource: 'team_payments', actions: '*' },
      { resource: 'team_webhook', actions: '*' },
      { resource: 'team_api_key', actions: '*' }
    ]
  }
];

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const roleConfig = availableRoles.find(r => r.id === role);
  if (!roleConfig) return false;

  // SYSADMIN has full access
  if (role === Role.SYSADMIN) return true;

  for (const permission of roleConfig.permissions) {
    if (permission === '*') {
      return true;
    }
    if (typeof permission === 'object' && permission.resource === resource) {
      return permission.actions === '*' || permission.actions.includes(action);
    }
  }
  
  return false;
}

export async function checkPageAccess(
  session: Session | null,
  resource: Resource,
  action: Action,
  teamSlug?: string
): Promise<AccessCheckResult> {
  if (!session?.user || !session.user.systemRole) {
    return {
      allowed: false,
      message: 'Unauthorized - No session found',
      status: 401,
      resource,
      action
    };
  }

  if (!resource) {
    return {
      allowed: false,
      message: 'Bad Request - Resource is required',
      status: 400,
      resource,
      action
    };
  }

  // Check system role first (SYSADMIN has full access)
  if (hasPermission(session.user.systemRole, resource, action)) {
    return {
      allowed: true,
      message: `Access granted for ${action} on ${resource}`,
      status: 200,
      resource,
      action
    };
  }

  // If teamSlug is provided, check team-specific role
  if (teamSlug && session.user.roles) {
    const teamRole = session.user.roles.find(role => 
      role.teamId && role.teamId.toString() === teamSlug
    );
    if (teamRole && hasPermission(teamRole.role, resource, action)) {
      return {
        allowed: true,
        message: `Access granted for ${action} on ${resource}`,
        status: 200,
        resource,
        action
      };
    }
  }

  return {
    allowed: false,
    message: `Forbidden - Missing required permissions for ${action} on ${resource}`,
    status: 403,
    resource,
    action
  };
}
