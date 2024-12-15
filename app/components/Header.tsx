import { Icons } from '~/components/Icons';
import { MainNav } from '~/components/MainNav';
import { NavSearch } from '~/components/NavSearch';
import { SessionUser } from '~/server/auth';
import { Button } from './ui/button';
import { AvatarMenu } from './UserMenu';
import { Link } from '@tanstack/react-router';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"

export function Header({ user }: { user: SessionUser | null }) {
  const navItems = [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Bookmarks',
      href: '/bookmarks/',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav title="FOSDEM PWA" items={navItems} />
        <div className="flex flex-1 items-center space-x-4 sm:justify-end">
          <nav className="hidden md:flex space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon" className="h-7 w-7" asChild>
                    <a
                      href="https://github.com/nicholasgriffintn/fosdem-pwa"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icons.gitHub className="h-7 w-7" width="7" height="7" />
                      <span className="sr-only">Source Code</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View source code on GitHub</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  {user ? (
                    <AvatarMenu user={user} />
                  ) : (
                    <Button variant="link" size="icon" className="h-7 w-7" asChild>
                      <Link to="/signin">
                        <Icons.login className="h-7 w-7" width="7" height="7" />
                        <span className="sr-only">Sign In</span>
                      </Link>
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign in to save favourites</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
          <div className="flex-1 sm:grow-0">
            <NavSearch />
          </div>
        </div>
      </div>
    </header>
  );
}