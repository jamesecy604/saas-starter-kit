import { Teams } from '@/components/team';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { withAccessControl } from '@/lib/permissions/withAccessControl';

const AllTeams: NextPageWithLayout = () => {
  return <Teams />;
};

export const getServerSideProps = withAccessControl(
  async (context: GetServerSidePropsContext) => {
    return {
      props: {
        ...(context.locale ? await serverSideTranslations(context.locale, ['common']) : {}),
      },
    };
  },
  { roles: ['OWNER', 'ADMIN', 'MEMBER'] }
);

export default AllTeams;
