import { LoadingState } from "~/components/shared/LoadingState";
import { cn } from "~/lib/utils";

type RouteLoadingStateProps = {
	message?: string;
	className?: string;
};

export function RouteLoadingState({
	message = "Loading...",
	className,
}: RouteLoadingStateProps) {
	return (
		<div
			className={cn(
				"min-h-[60vh] flex items-center justify-center",
				className,
			)}
		>
			<LoadingState type="spinner" message={message} variant="centered" />
		</div>
	);
}
