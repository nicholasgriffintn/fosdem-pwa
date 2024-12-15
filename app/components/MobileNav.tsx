import type { ReactNode } from 'react';
import { Link } from "@tanstack/react-router";

import { cn } from '~/lib/utils';
import { useLockBody } from '~/hooks/use-lock-body';

interface MobileNavProps {
  items: { title: string; href: string; disabled?: boolean }[];
  onCloseMenu: () => void;
  children?: ReactNode;
}

export function MobileNav({ items, onCloseMenu }: MobileNavProps) {
  useLockBody();

  return (
    <div
      className={cn(
        'fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden'
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.disabled ? '#' : item.href}
              className={cn(
                'flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline',
                item.disabled && 'cursor-not-allowed opacity-60'
              )}
              onClick={onCloseMenu}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}