import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';
import { Role } from '@/lib/permissions';

type AccessControlOptions = {
  roles?: Role[];
};

export function withAccessControl(
  getServerSideProps: GetServerSideProps,
  options: AccessControlOptions = {}
) {
  return async (context: GetServerSidePropsContext) => {
    const session = await getSession(context);

    if (!session) {
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }

    // Check if user is system admin
    if (session.user.systemRole === 'SYSADMIN') {
      // Redirect system admins away from teams page
      if (context.resolvedUrl.startsWith('/teams')) {
        return {
          redirect: {
            destination: '/model-management',
            permanent: false,
          },
        };
      }
      
      console.log('System admin access granted');
      const result = await getServerSideProps(context);
      return {
        ...result,
        props: {
          ...('props' in result ? result.props : {}),
          session,
        },
      };
    }

    // Check if user has required role
    // if (options.roles) {
    //   const userRoles = session.user.roles || [];
    //   console.log("session.user.roles:",session);     
    //   if (!userRoles.length || 
    //       !userRoles.some(role => options.roles?.includes(role.role))) {
    //     return {
    //       redirect: {
    //         destination: '/',
    //         permanent: false,
    //       },
    //     };
    //   }
    // }

    const result = await getServerSideProps(context);
    return {
      ...result,
      props: {
        ...('props' in result ? result.props : {}),
        session,
      },
    };
  };
}
