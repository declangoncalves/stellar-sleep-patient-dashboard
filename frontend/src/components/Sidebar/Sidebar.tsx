// frontend/src/components/Sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  EnvelopeIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';

import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
}

interface LinkItem {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const links: LinkItem[] = [
    { href: '/patients', label: 'Patients', Icon: UsersIcon },
    { href: '/calendar', label: 'Calendar', Icon: CalendarDaysIcon },
    { href: '/mail', label: 'Mail', Icon: EnvelopeIcon },
    { href: '/billing', label: 'Billing', Icon: CreditCardIcon },
    { href: '/chat', label: 'Chat', Icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div
      className={`${styles.sidebar} flex flex-col h-full borde-solid border-r border-gray-300 border-r-2`}
    >
      <div className={`${styles.logoWrapper} flex items-center justify-center`}>
        <Image
          src="/icons/stellar-sleep.png"
          alt="Stellar Sleep Logo"
          width={40}
          height={40}
        />
      </div>
      <ul>
        {links.map(({ href, Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(href + '/');
          return (
            <li
              key={href}
              className={`${isActive ? 'bg-blue-100 border-l-4 border-blue-500' : ''} group flex justify-center w-full h-20 hover:bg-blue-100`}
            >
              <Link
                href={href}
                className={`
                flex items-center space-x-2
                p-4
                ${collapsed ? 'justify-center' : ''}
              `}
              >
                <Icon className="w-7 h-7 flex-shrink-0 text-gray-700" />

                {/* Show label only when not collapsed */}
                {/* {!collapsed && <span>{label}</span>} */}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
