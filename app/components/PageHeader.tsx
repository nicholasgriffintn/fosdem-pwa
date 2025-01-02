import { cn } from '~/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
  displayHeading?: boolean;
}

export function PageHeader({ heading, text, className, children, displayHeading = true }: PageHeaderProps) {
  return (
    <>
      <div className="flex justify-between">
        <div className={cn('space-y-4', className)}>
          <h1 className={cn(
            'inline-block font-heading',
            displayHeading ? 'text-4xl lg:text-5xl' : 'sr-only'
          )}>
            {heading}
          </h1>
          {text && <p className="text-xl text-muted-foreground">{text}</p>}
        </div>
        {children}
      </div>
      {displayHeading && <hr className="my-4" />}
    </>
  );
}