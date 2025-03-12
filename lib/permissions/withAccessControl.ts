import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';
import { Role } from '@prisma/client';

type AccessControlConfig = {
  roles: Role[];
  allowPublic?: boolean;
};

export function withAccessControl(config: AccessControlConfig) {
  return (handler: GetServerSideProps) => {
    return async (context: GetServerSidePropsContext) => {
      const session = await getSession({ req: context.req });

      if (!session && !config.allowPublic) {
        return {
          redirect: {
            destination: '/auth/login',
            permanent: false,
          },
        };
      }

      if (session?.user?.systemRole) {
        // Skip role check for SYSADMIN as they have full access
        if (session.user.systemRole === 'SYSADMIN') {
          return handler(context);
        }

        // Check if user's role is allowed
        if (!config.roles.includes(session.user.systemRole)) {
          return {
            redirect: {
              destination: '/',
              permanent: false,
            },
          };
        }
      }

      return handler(context);
    };
  };
}
