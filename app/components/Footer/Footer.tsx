import { Icons } from '~/components/Icons';

export function Footer() {
  return (
    <footer>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.logo className="h-7 w-7" />
          <p className="text-center text-sm leading-loose md:text-left">
            <a href="/" className="font-medium underline underline-offset-4">
              FOSDEM PWA
            </a>
            . You can find the source code on{' '}
            <a
              href="https://github.com/nicholasgriffintn/fosdem-pwa"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
