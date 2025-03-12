import { Teams } from '@/components/team';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { withAccessControl } from '@/lib/permissions/withAccessControl';
import { getSession } from 'next-auth/react';

const AllTeams: NextPageWithLayout = () => {
  return <Teams />;
};

export const getServerSideProps = withAccessControl({
  roles: ['OWNER', 'ADMIN', 'MEMBER'],
})(async (context: GetServerSidePropsContext) => {
  return {
    props: {
      ...(context.locale ? await serverSideTranslations(context.locale, ['common']) : {}),
    },
  };
});

export default AllTeams;
