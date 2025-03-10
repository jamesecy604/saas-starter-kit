import { GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';

export async function requireAuth(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Allow system admin to access all pages
  if (session.user.systemRole === 'SYSADMIN') {
    return {
      props: { session },
    };
  }

  // Redirect non-system admins to teams page if they try to access admin pages
  if (context.resolvedUrl.startsWith('/model-management')) {
    return {
      redirect: {
        destination: '/teams',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
