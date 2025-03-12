export interface Model {
  id: string;
  name: string;
  nameInClient: string;
  provider: string;
  providerUrl: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ModelFormValues = {
  id?: string;
  name: string;
  nameInClient: string;
  provider: string;
  providerUrl: string;
  type: string;
};

export interface ModelFormProps {
  initialData?: ModelFormValues;
  modelId?: string;
  onSubmit: (values: ModelFormValues) => Promise<void>;
  onSuccess?: () => void;
}
