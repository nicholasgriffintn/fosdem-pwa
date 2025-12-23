import { Icons } from "~/components/shared/Icons";

export const navItems = [
  {
    title: "Schedule",
    href: "/",
    icon: <Icons.calendar className="h-4 w-4" />,
    mobile: true
  },
  {
    title: "Live",
    href: "/live",
    icon: <Icons.video className="h-4 w-4" />,
    mobile: true
  },
  {
    title: "Speakers",
    href: "/speakers",
    icon: <Icons.users className="h-4 w-4" />,
    mobile: false
  },
  {
    title: "Rooms",
    href: "/rooms",
    icon: <Icons.building className="h-4 w-4" />,
    mobile: false
  },
  {
    title: "Bookmarks",
    href: "/bookmarks",
    icon: <Icons.bookmark className="h-4 w-4" />,
    mobile: true
  },
  {
    title: "Search",
    href: "/search",
    icon: <Icons.search className="h-4 w-4" />,
    mobile: true,
    mobileOnly: true
  },
]