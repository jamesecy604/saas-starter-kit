import { Teams } from '@/components/team';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { getSession } from 'next-auth/react';
import { checkPageAccess } from '@/lib/permissions';

const AllTeams: NextPageWithLayout = () => {
  return <Teams />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context);
  
  const access = await checkPageAccess(session, 'team', 'read');
  if (!access.allowed) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(context.locale ? await serverSideTranslations(context.locale, ['common']) : {}),
    },
  };
};

export default AllTeams;
