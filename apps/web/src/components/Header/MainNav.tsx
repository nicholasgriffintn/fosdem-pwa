import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { Icons } from "~/components/Icons";
import { MobileNav } from "~/components/Header/MobileNav";
import { constants } from "~/constants";

type MainNavProps = {
	title: string;
	items?: {
		title: string;
		href: string;
		icon?: React.ReactNode;
		disabled?: boolean;
	}[];
};

export function MainNav({ title, items }: MainNavProps) {
	const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<div className="flex items-center gap-4 md:gap-6 lg:gap-10 shrink-0">
			<Link
				to="/"
				search={(prev: Record<string, unknown>) => ({
					...prev,
					year: prev.year || constants.DEFAULT_YEAR,
				})}
				className="items-center space-x-2 flex logo-link shrink-0"
			>
				<Icons.logo className="h-7 w-7" width="28" height="28" />
				<span className="hidden font-bold sm:inline-block">{title}</span>
			</Link>
			{items?.length ? (
				<nav className="hidden gap-2 xl:flex shrink-0" aria-label="Primary">
					{items?.map((item) => (
						<Link
							key={item.href}
							to={item.disabled ? "#" : item.href}
							className={cn(
								"nav-link flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground hover:bg-muted/60 whitespace-nowrap",
								item.disabled && "cursor-not-allowed opacity-80",
							)}
							activeProps={{
								className: cn(
									"nav-link flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
									"bg-muted text-foreground",
									item.disabled && "cursor-not-allowed opacity-80",
								),
							}}
							search={(prev: Record<string, unknown>) => ({
								...prev,
								year: prev.year || constants.DEFAULT_YEAR,
							})}
							activeOptions={{ exact: item.href === "/" }}
						>
							{item.icon}
							{item.title}
						</Link>
					))}
				</nav>
			) : null}
			<button
				type="button"
				ref={menuButtonRef}
				className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm font-medium xl:hidden shrink-0"
				onClick={() => setShowMobileMenu(!showMobileMenu)}
				aria-expanded={showMobileMenu}
				aria-controls="mobile-nav"
				aria-label={showMobileMenu ? "Close menu" : "Open menu"}
			>
				{showMobileMenu ? (
					<Icons.close width="18" height="18" />
				) : (
					<Icons.list width="18" height="18" />
				)}
				<span>Menu</span>
			</button>
			{showMobileMenu && items && (
				<MobileNav
					items={items}
					onCloseMenu={() => {
						setShowMobileMenu(false);
						menuButtonRef.current?.focus();
					}}
					returnFocusRef={menuButtonRef}
				/>
			)}
		</div>
	);
}
