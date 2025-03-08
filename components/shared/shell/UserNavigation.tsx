import {
  RectangleStackIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const UserNavigation = ({ activePathname }: NavigationProps) => {
  const { t } = useTranslation('common');
  const { data } = useSession();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (data?.user?.id) {
        try {
          const response = await fetch(`/api/getUserRole?id=${data.user.id}`);
          const result = await response.json();
          setRole(result.role);
        } catch (error) {
          console.error('Error fetching role:', error);
        }
      }
    };

    fetchRole();
  }, [data]);

  const menus: MenuItem[] = [
    ...(role !== 'MEMBER'
      ? [
          {
            name: t('all-teams'),
            href: '/teams',
            icon: RectangleStackIcon,
            active: activePathname === '/teams',
          },
        ]
      : []),
    {
      name: t('samples'),
      href: '/samples',
      icon: CodeBracketIcon,
      active: activePathname === '/samples',
    },
    {
      name: t('account'),
      href: '/settings/account',
      icon: UserCircleIcon,
      active: activePathname === '/settings/account',
    },
    {
      name: t('security'),
      href: '/settings/security',
      icon: ShieldCheckIcon,
      active: activePathname === '/settings/security',
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default UserNavigation;
