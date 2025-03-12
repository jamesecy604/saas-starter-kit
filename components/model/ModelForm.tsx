import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createModel, updateModel } from '@/lib/api/model';
import { toast } from 'react-hot-toast';

interface Model {
  id: string;
  name: string;
  nameInClient: string;
  provider: string;
  providerUrl: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

const modelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  nameInClient: z.string().min(1, 'Client Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  providerUrl: z.string().url('Invalid URL format'),
  type: z.string().min(1, 'Type is required'),
});

type ModelFormValues = {
  id?: string;
  name: string;
  nameInClient: string;
  provider: string;
  providerUrl: string;
  type: string;
};

interface ModelFormProps {
  initialData?: ModelFormValues;
  modelId?: string;
  onSubmit: (values: ModelFormValues) => Promise<void>;
  onSuccess?: () => void;
}

export function ModelForm({ initialData, modelId, onSuccess }: ModelFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: initialData || {
      name: '',
      nameInClient: '',
      provider: '',
      providerUrl: '',
      type: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ModelFormValues) => createModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model created successfully');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ModelFormValues) => updateModel(modelId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model updated successfully');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ModelFormValues) => {
    if (isEdit) {
      if (modelId) {
        updateMutation.mutate(data);
      } else {
        toast.error('Model ID is missing for update');
      }
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="Name in Client"
        {...register('nameInClient')}
        error={errors.nameInClient?.message}
      />
      <Input
        label="Provider"
        {...register('provider')}
        error={errors.provider?.message}
      />
      <Input
        label="Provider URL"
        {...register('providerUrl')}
        error={errors.providerUrl?.message}
      />
      <Input
        label="Type"
        {...register('type')}
        error={errors.type?.message}
      />
      <Button 
        type="submit" 
        loading={createMutation.status === 'pending' || updateMutation.status === 'pending'}
      >
        {isEdit ? 'Update Model' : 'Create Model'}
      </Button>
    </form>
  );
}
