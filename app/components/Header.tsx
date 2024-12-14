import { Icons } from '~/components/Icons';
import { MainNav } from '~/components/MainNav';
import { NavSearch } from '~/components/NavSearch';

export function Header() {
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
          <div className="flex-1 sm:grow-0">
            <NavSearch />
          </div>
          <nav className="hidden md:flex space-x-4">
            <a
              href="https://github.com/nicholasgriffintn/fosdem-pwa"
              target="_blank"
              rel="noreferrer"
            >
              <Icons.gitHub className="h-7 w-7" width="7" height="7" />
              <span className="sr-only">GitHub</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}