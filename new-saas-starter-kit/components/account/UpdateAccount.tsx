import type { User } from '@prisma/client';
import UploadAvatar from './UploadAvatar';
import UpdateName from './UpdateName';
import UpdateEmail from './UpdateEmail';
import UpdateTheme from './UpdateTheme';
import BalanceDisplay from './BalanceDisplay';
import env from '@/lib/env';

interface UpdateAccountProps {
  user: Partial<User>;
  allowEmailChange: boolean;
}

const UpdateAccount = ({ user, allowEmailChange }: UpdateAccountProps) => {
  return (
    <div className="flex gap-6 flex-col">
      <UpdateName user={user} />
      <UpdateEmail user={user} allowEmailChange={allowEmailChange} />
      <UploadAvatar user={user} />
      {env.darkModeEnabled && <UpdateTheme />}
      <BalanceDisplay />
    </div>
  );
};

export default UpdateAccount;
