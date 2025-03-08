import Samples from '../../components/samples/Samples';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function SamplesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push('/auth/join');
    return null;
  }

  return (
    <div className="p-6">
      <Samples />
    </div>
  );
}
