import { useState } from 'react';
import { Link } from "@tanstack/react-router";

import { cn } from '~/lib/utils';
import { Icons } from '~/components/Icons';
import { MobileNav } from '~/components/MobileNav';

export function MainNav({
  title,
  items,
}: {
  title: string;
  items?: { title: string; href: string; disabled?: boolean }[];
}) {
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  return (
    <div className="flex gap-6 md:gap-10">
      <Link to="/" className="items-center space-x-2 flex logo-link">
        <Icons.logo className="h-7 w-7" width="28" height="28" />
        <span className="hidden font-bold sm:inline-block">{title}</span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 lg:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              to={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm',
                'text-foreground/60',
                item.disabled && 'cursor-not-allowed opacity-80'
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 lg:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu && <Icons.close width="28" height="28" />}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} onCloseMenu={() => setShowMobileMenu(false)} />
      )}
    </div>
  );
}