import type { ReactNode } from 'react';
import { Link } from '@remix-run/react';

import { cn } from '~/lib/utils';
import { useLockBody } from '~/hooks/useLockBody';
import { Icons } from '~/components/Icons';

interface MobileNavProps {
  items: { title: string; href: string; disabled?: boolean }[];
  children?: ReactNode;
}

export function MobileNav({ items }: MobileNavProps) {
  useLockBody();

  return (
    <div
      className={cn(
        'fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden'
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link to="/" className="flex items-center space-x-2">
          <Icons.logo className="h-7 w-7" />
          <span className="font-bold">FOSDEM 2024</span>
        </Link>
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.disabled ? '#' : item.href}
              className={cn(
                'flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline',
                item.disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
