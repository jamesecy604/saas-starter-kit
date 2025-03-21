import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { useRouter } from 'next/router';
import type { ApiResponse } from 'types';
import { Invitation, Team } from '@prisma/client';

type Response = ApiResponse<Invitation & { team: Team }>;

const useInvitation = (token?: string) => {
  const { query, isReady } = useRouter();

  const { data, error, isLoading } = useSWR<Response>(() => {
    const inviteToken = token || (isReady ? query.token : null);
    return inviteToken ? `/api/invitations/${inviteToken}` : null;
  }, fetcher);
  
  // Return consistent initial state
  if (isLoading || !data) {
    return {
      isLoading: true,
      error: null,
      invitation: null
    };
  }

  if (error || !data.data) {
    return {
      isLoading: false,
      error: error || new Error('No invitation data found'),
      invitation: null
    };
  }

  return {
    isLoading: false,
    error: null,
    invitation: {
      ...data.data,
      email: data.data.email
    }
  };
};

export default useInvitation;
