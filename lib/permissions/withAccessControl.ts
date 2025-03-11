import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { Role } from '@/lib/permissions';
import { ApiError } from '@/lib/errors';
import { getTeam } from 'models/team';
import { getTeamMember } from 'models/teamMember';

type AccessControlOptions = {
  roles?: Role[];
};

type ApiContext = {
  req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> };
  res: ServerResponse<IncomingMessage>;
};

type ApiHandler = (context: ApiContext) => Promise<void>;

export async function throwIfNoTeamAccess(req: any, res: any) {
  const session = await getServerSession(
    req,
    res,
    getAuthOptions(req, res)
  );

  if (!session) {
    throw new ApiError(401, 'Unauthorized');
  }

  const team = await getTeam({ slug: req.query.slug });
  
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  const teamMember = await getTeamMember({
    teamId: team.id,
    userId: session.user.id
  });

  if (!teamMember) {
    throw new ApiError(403, 'Forbidden');
  }

  return teamMember;
}

export function withAccessControl(
  handler: GetServerSideProps | ApiHandler, 
  options: AccessControlOptions = {}
) {
  return async (
    context: GetServerSidePropsContext | ApiContext
  ) => {
    const session = await getServerSession(
      context.req,
      context.res,
      getAuthOptions(context.req, context.res)
    );

    if (!session) {
      // Handle API routes
      if ('res' in context && 'status' in context.res) {
        (context.res as ServerResponse).statusCode = 401;
        (context.res as ServerResponse).setHeader('Content-Type', 'application/json');
        (context.res as ServerResponse).end(JSON.stringify({ error: 'Unauthorized' }));
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
      return (handler as ApiHandler)(context);
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
