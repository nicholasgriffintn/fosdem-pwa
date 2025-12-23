import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { constants } from "~/constants";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { buildHomeLink } from "~/lib/link-builder";

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  heading: string;
  subtitle?: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
  displayHeading?: boolean;
  breadcrumbs?: {
    title: string;
    href: string;
    search?: Record<string, string | number | string[] | number[]>;
  }[];
  metadata?: {
    text: string;
    href?: string;
  }[];
  year?: number;
};

export function PageHeader({
  heading,
  subtitle,
  text,
  className,
  children,
  displayHeading = true,
  breadcrumbs,
  metadata,
  year = constants.DEFAULT_YEAR,
}: PageHeaderProps) {
  return (
    <>
      {year && year !== constants.DEFAULT_YEAR && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>
            <span>
              You are viewing the {year} edition of FOSDEM.{" "}
              <Link {...buildHomeLink()}>
                Click here to view the {constants.DEFAULT_YEAR} edition
              </Link>
            </span>
          </AlertTitle>
        </Alert>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <ul className="flex flex-row flex-nowrap gap-2 mb-4 text-sm text-muted-foreground overflow-hidden">
          {breadcrumbs.map((breadcrumb, index) => (
            <li
              key={breadcrumb.href}
              className="flex flex-row items-center flex-shrink min-w-0"
            >
              <Link
                to={breadcrumb.href}
                search={(prev: Record<string, unknown>) => ({
                  ...prev,
                  ...breadcrumb.search,
                })}
                className="no-underline truncate"
              >
                {breadcrumb.title}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <span className="text-muted-foreground ml-2 flex-shrink-0">{" / "}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div className={cn("space-y-4", className)}>
          <h1
            className={cn(
              "inline-block font-heading",
              displayHeading ? "text-4xl lg:text-5xl" : "sr-only"
            )}
          >
            {heading}
          </h1>
          {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
          {metadata && (
            <p className="text-base text-muted-foreground">
              {metadata.map((meta, index) => (
                <span key={meta.text}>
                  {meta.href ? (
                    <Link
                      to={meta.href}
                      search={(prev: Record<string, unknown>) => ({ ...prev })}
                    >
                      {meta.text}
                    </Link>
                  ) : (
                    meta.text
                  )}
                  {index < metadata.length - 1 && " | "}
                </span>
              ))}
            </p>
          )}
          {text && <p className="text-xl text-muted-foreground">{text}</p>}
        </div>
        {children && <div className="flex justify-end">{children}</div>}
      </div>
      {displayHeading && <div className="my-4" />}
    </>
  );
}
