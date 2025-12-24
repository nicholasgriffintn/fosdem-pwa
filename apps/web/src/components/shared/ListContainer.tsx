import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type ListContainerProps = {
  children: ReactNode;
  className?: string;
};

export const listContainerClass = "w-full divide-y divide-border rounded-lg border border-border bg-card/40";

export function ListContainer({ children, className }: ListContainerProps) {
  return (
    <ul className={cn(listContainerClass, className)}>
      {children}
    </ul>
  );
}

type ListEmptyStateProps = {
  title: string;
  description: string;
};

export function ListEmptyState({ title, description }: ListEmptyStateProps) {
  return (
    <li>
      <div className="flex justify-between px-3 py-4">
        <div className="flex flex-col space-y-1.5">
          <div className="font-semibold leading-none tracking-tight">
            {title}
          </div>
          <p className="text-muted-foreground text-sm">
            {description}
          </p>
        </div>
      </div>
    </li>
  );
}
