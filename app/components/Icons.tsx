import {
	X,
	SunMedium,
	Moon,
	Star,
	Share,
	Megaphone,
	ArrowLeft,
	LogIn,
	LogOut,
	Bookmark,
	Video,
	Home,
	Map as MapIcon,
	Building2,
	Globe,
	MapPin,
	Twitter,
	User,
	Wifi,
	WifiOff,
	Pencil,
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	List,
	CalendarDays,
	Play,
	Clock,
	AlertCircle,
} from "lucide-react";

export const Icons = {
	logo: ({ ...props }) => (
		<svg
			aria-hidden="true"
			focusable="false"
			data-prefix="fab"
			data-icon="logo"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="6.01 6.05 781.98 787.68"
			{...props}
		>
			<g fill="#ab1b93" stroke="#ab1b93">
				<path
					strokeWidth="11.555"
					d="M327.22 457.22c-31.7 0-57.32-25.63-57.32-57.33 0-31.71 25.62-57.33 57.32-57.33 31.69 0 57.32 25.62 57.32 57.33 0 31.7-25.63 57.33-57.32 57.33zm139.56 0c-31.69 0-57.32-25.63-57.32-57.33 0-31.71 25.63-57.33 57.32-57.33 31.7 0 57.32 25.62 57.32 57.33 0 31.7-25.62 57.33-57.32 57.33z"
				/>
				<path
					strokeLinejoin="round"
					strokeWidth="11.963"
					d="M406.16 78.2c22.71.69 45.29 3.78 67.34 9.22l.19-.8 52.14-61.36 31.2 11.91-2.01 80.51-.84 1.55a322.308 322.308 0 0 1 55.16 39.04l1.57-1.82 74.68-30.09 22.08 25.05-39.19 70.35-2.4 1.59a322.284 322.284 0 0 1 30.79 59.94l3.09-1.22 80.1 8.07 7.93 32.44-67.39 44.07-3.24.35c1.13 10.92 1.71 21.9 1.72 32.89-.13 11.5-.87 22.99-2.22 34.41l3.59.39 67.19 44.38-8.06 32.41-80.15 7.71-2.89-1.16a322.083 322.083 0 0 1-31.27 59.71l2.41 1.62 38.88 70.52-22.21 24.95-74.54-30.43-1.49-1.75a322.254 322.254 0 0 1-55.33 38.89l.75 1.38 1.66 80.52-31.26 11.77-51.86-61.59-.22-.94a321.596 321.596 0 0 1-67.32 8.83v.15l-35.95 72.07-33.13-4.1-17.32-77.83a322.374 322.374 0 0 1-64.66-23.8l-64.19 45.8-27.44-19.04 20.14-75.69a322.234 322.234 0 0 1-46.63-51.95l-77 10.28-15.44-29.61 52.17-57.13a321.61 321.61 0 0 1-16.89-68.27L6.01 415.77l.08-33.4 72.49-26.3c3.16-23.33 8.86-46.25 17.02-68.34l-51.72-57.22 15.58-29.54 77.01 10.65a322.384 322.384 0 0 1 46.71-51.9l-19.71-75.65 27.52-18.91 64.1 46.22a321.299 321.299 0 0 1 64.64-23.64L337.4 10l33.16-3.95zm-59.6 114.99c-114.13 27.87-184.06 143-156.2 257.15s142.96 184.1 257.08 156.24c114.13-27.86 184.07-143 156.2-257.15-23.99-98.32-113.91-166.12-215.02-162.14-14.18.56-28.27 2.54-42.06 5.9z"
				/>
			</g>
		</svg>
	),
	login: LogIn,
	logout: LogOut,
	arrowLeft: ArrowLeft,
	close: X,
	sun: SunMedium,
	moon: Moon,
	star: Star,
	share: Share,
	megaphone: Megaphone,
	home: Home,
	video: Video,
	bookmark: Bookmark,
	map: MapIcon,
	building: Building2,
	globe: Globe,
	twitter: Twitter,
	mapPin: MapPin,
	user: User,
	wifi: Wifi,
	wifiOff: WifiOff,
	pencil: Pencil,
	alertTriangle: AlertTriangle,
	chevronDown: ChevronDown,
	chevronUp: ChevronUp,
	list: List,
	calendar: CalendarDays,
	play: Play,
	alertCircle: AlertCircle,
	gitHub: ({ ...props }) => (
		<svg
			aria-hidden="true"
			focusable="false"
			data-prefix="fab"
			data-icon="github"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 496 512"
			{...props}
		>
			<path
				fill="currentColor"
				d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
			/>
		</svg>
	),
	clock: Clock,
};
