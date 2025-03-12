import type { Session } from 'next-auth';
import { Role, Resource, Action, availableRoles } from '@/lib/permissions';

export type AccessCheckResult = {
  allowed: boolean;
  message: string;
  status: number;
  resource: Resource;
  action: Action;
};

// Cache session for 5 minutes
const sessionCache = new Map<string, { session: any, timestamp: number }>();

function checkAccessCore(
  session: Session | null,
  resource: Resource,
  action: Action,
  teamSlug?: string
): AccessCheckResult {
  
  if (!session?.user) {
    return {
      allowed: false,
      message: 'Unauthorized - No session found',
      status: 401,
      resource,
      action
    };
  }a

  // If system role is required, check it separately in specific permission logic

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
  const systemRole = session.user.systemRole || Role.MEMBER;
  if (hasPermission(systemRole, resource, action)) {
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

export async function checkAccess(
  session: Session | null,
  resource: Resource,
  action: Action,
  teamSlug?: string
): Promise<AccessCheckResult> {
  try {
    return checkAccessCore(session, resource, action, teamSlug);
  } catch (error) {
    console.error('Error checking access:', error);
    return {
      allowed: false,
      message: 'Internal server error',
      status: 500,
      resource,
      action
    };
  }
}

function hasPermission(role: Role, resource: Resource, action: Action): boolean {
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
