import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { Role } from '@/lib/permissions';

type AccessControlOptions = {
  roles?: Role[];
};

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withAccessControl(
  handler: GetServerSideProps | ApiHandler,
  options: AccessControlOptions = {}
) {
  return async (context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }) => {
    const session = await getServerSession(
      context.req,
      context.res,
      getAuthOptions(context.req, context.res)
    );

    if (!session) {
      // Handle API routes
      if ('res' in context && 'status' in context.res) {
        (context.res as NextApiResponse).status(401).json({ error: 'Unauthorized' });
        return;
      }
      // Handle getServerSideProps
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }

    // Handle API routes
    if ('res' in context && 'status' in context.res) {
      const apiReq = context.req as NextApiRequest;
      const apiRes = context.res as NextApiResponse;
      return (handler as ApiHandler)(apiReq, apiRes);
    }

    // Handle getServerSideProps
    const ssrContext = context as GetServerSidePropsContext;
    
    // Check if user is system admin
    if (session.user.systemRole === 'SYSADMIN') {
      // Redirect system admins away from teams page
      if (ssrContext.resolvedUrl.startsWith('/teams')) {
        return {
          redirect: {
            destination: '/model-management',
            permanent: false,
          },
        };
      }
      
      console.log('System admin access granted');
      const result = await (handler as GetServerSideProps)(ssrContext);
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

    const result = await (handler as GetServerSideProps)(ssrContext);
    return {
      ...result,
      props: {
        ...('props' in result ? result.props : {}),
        session,
      },
    };
  };
}
