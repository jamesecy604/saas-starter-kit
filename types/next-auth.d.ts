import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      roles: { teamId: string; role: Role }[];
      systemRole?: 'SYSADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER';
    };
    accessToken?: string;
    redirectPath?: string;
  }

  interface Error {
    status?: number;
  }

  interface User {
    systemRole?: 'SYSADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER';
  }

  interface Profile {
    requested: {
      tenant: string;
    };
    roles: string[];
    groups: string[];
  }
}
