import { Loading } from '@/components/shared';
import useTeams from 'hooks/useTeams';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from 'types';
import { useSession } from 'next-auth/react';

const Dashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { teams, isLoading } = useTeams();
  const [isRedirectChecked, setRedirectChecked] = useState(false);
  const { data: session } = useSession();
  const systemRole = session?.user?.systemRole;

  useEffect(() => {
    if (isLoading || !teams) {
      return;
    }

    // Only redirect non-sysadmin users
    if (systemRole !== 'SYSADMIN') {
      if (teams.length > 0) {
        router.push(`/teams/${teams[0].slug}/settings`);
      } else {
        router.push('teams?newTeam=true');
      }
    } else {
      setRedirectChecked(true);
    }
  }, [isLoading, router, teams, systemRole]);

  if (!isRedirectChecked || isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Tenants</h2>
          <p className="text-gray-600">Manage all tenants in the system</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <p className="text-gray-600">View and manage system users</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Settings</h2>
          <p className="text-gray-600">Configure system-wide settings</p>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Dashboard;
