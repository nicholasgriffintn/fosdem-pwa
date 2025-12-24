import type { ReactNode } from "react";

export type NavItem = {
  title: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
  mobile?: boolean;
  mobileOnly?: boolean;
};

export type BookmarkAction = {
  type: string;
  slug: string;
  status: string;
};

export type BookmarkActionWithYear = BookmarkAction & {
  year: number;
};

export type OnCreateBookmark = (params: BookmarkAction) => void;
