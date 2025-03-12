import fetcher from '@/lib/fetcher';

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

export const createModel = async (data: { 
  name: string;
  nameInClient: string;
  provider: string;
  providerUrl: string;
  type: string;
}) => {
  const response = await fetch('/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create model');
  }

  // Wait for Supabase replication
  const result = await response.json();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  // Revalidate models list
  await fetch('/api/revalidate?path=/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Force refresh the page
  window.location.reload();

  return result;
};

export const getModels = async () => {
  return fetcher('/api/models') as Promise<Model[]>;
};

export const getModel = async (id: string) => {
  return fetcher(`/api/models/${id}`) as Promise<Model>;
};

export const updateModel = async (id: string, data: Partial<Model>) => {
  const response = await fetch(`/api/models/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteModel = async (id: string) => {
  const numericId = Number(id);
  if (isNaN(numericId)) {
    throw new Error('Invalid model ID format');
  }

  const response = await fetch(`/api/models/${numericId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete model');
  }

  // Wait for Supabase replication
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  // Revalidate models list
  await fetch('/api/revalidate?path=/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return { success: true };
};
