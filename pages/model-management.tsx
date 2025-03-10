import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withAccessControl } from '@/lib/permissions/withAccessControl';

export default function ModelManagement() {
  const { t } = useTranslation('common');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('model-management')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Model management content goes here</p>
      </div>
    </div>
  );
}

export const getServerSideProps = withAccessControl(
  async (context) => {
    return {
      props: {
        ...(await serverSideTranslations(context.locale || 'en', ['common'])),
      },
    };
  },
  { roles: ['SYSADMIN'] }
);
