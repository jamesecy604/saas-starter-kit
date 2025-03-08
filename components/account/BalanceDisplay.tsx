import { useQuery } from '@tanstack/react-query';
import { Card, Loading } from '@/components/shared';
import { getBalance } from '@/lib/api/balance';

interface BalanceData {
  balanceOfInput: number;
  balanceOfOutput: number;
}

export default function BalanceDisplay() {
  const { data, isLoading, error } = useQuery<BalanceData>({
    queryKey: ['balance'],
    queryFn: getBalance
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error loading balance</div>;
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Token Balances</h2>
        <div className="space-y-2">
          <div className="text-lg">
            Input Tokens: {data?.balanceOfInput || 0}
          </div>
          <div className="text-lg">
            Output Tokens: {data?.balanceOfOutput || 0}
          </div>
        </div>
      </div>
    </Card>
  );
}
