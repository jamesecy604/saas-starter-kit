import fetcher from '@/lib/fetcher';

export async function getBalance() {
  return fetcher('/api/balance');
}
