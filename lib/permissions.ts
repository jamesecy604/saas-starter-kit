import { Role } from '@prisma/client';

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
      { resource: 'model_management', actions: '*' }, // model-management
      
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

export const permissions: RolePermissions = {
  SYSADMIN: [
    
    
  ],
  OWNER: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_payments',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'team',
      actions: ['read', 'leave'],
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
  ],
  MEMBER: [
    {
      resource: 'team',
      actions: ['read', 'leave'],
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
  ],
};
