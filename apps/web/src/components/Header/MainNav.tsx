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
		<div className="flex gap-6 md:gap-10">
			<Link
				to="/"
				search={(prev) => ({
					...prev,
					year: prev.year || constants.DEFAULT_YEAR,
				})}
				className="items-center space-x-2 flex logo-link"
			>
				<Icons.logo className="h-7 w-7" width="28" height="28" />
				<span className="hidden font-bold sm:inline-block">{title}</span>
			</Link>
			{items?.length ? (
				<nav className="hidden gap-6 lg:flex">
					{items?.map((item) => (
						<Link
							key={item.href}
							to={item.disabled ? "#" : item.href}
							className={cn(
								"nav-link flex items-center gap-2 text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
								"text-foreground/60",
								item.disabled && "cursor-not-allowed opacity-80",
							)}
							search={(prev) => ({
								...prev,
								year: prev.year || constants.DEFAULT_YEAR,
							})}
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
				className="flex items-center space-x-2 lg:hidden"
				onClick={() => setShowMobileMenu(!showMobileMenu)}
				aria-expanded={showMobileMenu}
				aria-controls="mobile-nav"
				aria-label={showMobileMenu ? "Close menu" : "Open menu"}
			>
				{showMobileMenu && <Icons.close width="28" height="28" />}
				<span className="font-bold">Menu</span>
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
