import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { ModelForm } from '@/components/model/ModelForm';
import { Button } from '@/components/shared/Button';
import { getModels, createModel, updateModel, deleteModel } from '@/lib/api/model';
import { Model, ModelFormValues } from '../types/model';
import { toast } from 'react-hot-toast';


export default function ModelManagement() {
  const { t } = useTranslation('common');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const data = await getModels();
      setModels(data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error(t('fetch-models-error'));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (values: ModelFormValues) => {
    setIsSubmitting(true);
    try {
      await createModel(values);
      await fetchModels();
      setShowForm(false);
      toast.success(t('model-created'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('create-model-error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: ModelFormValues) => {
    setIsSubmitting(true);
    try {
      await updateModel(values.id!, values);
      await fetchModels();
      setSelectedModel(null);
      setShowForm(false);
      toast.success(t('model-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('update-model-error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm-delete'))) return;
    
    setIsDeleting(true);
    try {
      await deleteModel(id);
      await fetchModels();
      toast.success(t('model-deleted'));
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t('delete-model-error'));
      // Re-fetch models to ensure UI is in sync
      await fetchModels();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('model-management')}</h1>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedModel(null);
            setShowForm(true);
          }}
        >
          {t('create-model')}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <ModelForm
            modelId={selectedModel?.id}
            initialData={selectedModel ? {
              id: selectedModel.id,
              name: selectedModel.name,
              nameInClient: selectedModel.nameInClient,
              provider: selectedModel.provider,
              providerUrl: selectedModel.providerUrl,
              type: selectedModel.type
            } : undefined}
            onSubmit={selectedModel ? handleUpdate : handleCreate}
            onSuccess={() => {
              setShowForm(false);
              setSelectedModel(null);
            }}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">{t('name')}</th>
              <th className="text-left p-2">{t('client-name')}</th>
              <th className="text-left p-2">{t('provider')}</th>
              <th className="text-left p-2">{t('type')}</th>
              <th className="text-right p-2">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{model.name}</td>
                <td className="p-2">{model.nameInClient}</td>
                <td className="p-2">{model.provider}</td>
                <td className="p-2">{model.type}</td>
                <td className="p-2 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setSelectedModel(model);
                      setShowForm(true);
                    }}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(model.id)}
                    loading={isDeleting}
                  >
                    {t('delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const getServerSideProps = async (context) => {
  const session = await getServerSession(
    context.req,
    context.res,
    getAuthOptions(context.req, context.res)
  );

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/join',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(context.locale || 'en', ['common'])),
    },
  };
};
