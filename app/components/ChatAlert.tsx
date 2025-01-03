import { Icons } from "~/components/Icons";

export function ChatAlert({ chatUrl }: { chatUrl: string }) {
	return (
		<div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
			<div className="flex items-center gap-2 px-4 py-3">
				<Icons.logo className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					Get involved in the conversation!
				</span>
				<a
					href={chatUrl}
					target="_blank"
					rel="noreferrer"
					className="text-sm text-primary hover:underline"
				>
					Join the chat
				</a>
			</div>
		</div>
	);
}
