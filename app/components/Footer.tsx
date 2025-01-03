import { Icons } from "~/components/Icons";
import { YearSelector } from "~/components/YearSelector";

export function Footer() {
	return (
		<footer className="border-t">
			<div className="container">
				<div className="flex flex-col gap-6 py-6 md:gap-0">
					<div className="flex flex-col items-center justify-between md:flex-row">
						<div className="flex items-center space-x-3">
							<Icons.logo className="h-8 w-8" width="32" height="32" />
							<span className="font-medium">FOSDEM PWA</span>
						</div>

						<div className="scale-90">
							<YearSelector />
						</div>
					</div>

					<div className="flex flex-wrap md:mt-4 items-center justify-center md:items-start md:justify-start gap-x-2 text-sm text-muted-foreground">
						<span>Using data from</span>
						<a
							href="https://fosdem.org/"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-foreground hover:underline"
						>
							FOSDEM
						</a>
						<span>•</span>
						<span>Hosted on</span>
						<a
							href="https://www.cloudflare.com/"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-foreground hover:underline"
						>
							Cloudflare
						</a>
						<span>&</span>
						<a
							href="https://vercel.com/"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-foreground hover:underline"
						>
							Vercel
						</a>
						<span>•</span>
						<a
							href="https://github.com/nicholasgriffintn/fosdem-pwa"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-foreground hover:underline"
						>
							Source Code
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
