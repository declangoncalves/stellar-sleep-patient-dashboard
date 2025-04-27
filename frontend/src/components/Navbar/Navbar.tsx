'use client';

import { HTMLAttributes } from 'react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDaysIcon,
  CreditCardIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';

interface LinkItem {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export function Navbar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();
  const links: LinkItem[] = [
    { href: '/patients', label: 'Patients', Icon: UsersIcon },
    { href: '/scheduling', label: 'Scheduling', Icon: CalendarDaysIcon },
    { href: '/billing', label: 'Billing', Icon: CreditCardIcon },
  ];

  return (
    <div
      className={clsx(
        'bg-white border-b border-gray-200 h-[var(--navbar-height)]',
        className,
      )}
      {...props}
    >
      <div className="h-full flex items-center justify-between px-16">
        <div className="flex items-center space-x-8">
          <Image
            src="/logo-dark-1.svg"
            alt="Stellar Sleep"
            width={120}
            height={32}
            priority
          />
          <ul className="flex space-x-1">
            {links.map(({ href, Icon, label }) => {
              const isActive =
                pathname === href || pathname?.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={clsx(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
