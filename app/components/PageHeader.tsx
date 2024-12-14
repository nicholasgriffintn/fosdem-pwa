import { cn } from '~/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ heading, text, className, children }: PageHeaderProps) {
  return (
    <>
      <div className="flex justify-between">
        <div className={cn('space-y-4', className)}>
          <h1 className="inline-block font-heading text-4xl lg:text-5xl">
            {heading}
          </h1>
          {text && <p className="text-xl text-muted-foreground">{text}</p>}
        </div>
        {children}
      </div>
      <hr className="my-4" />
    </>
  );
}