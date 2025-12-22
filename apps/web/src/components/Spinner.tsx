import { LoadingState } from "~/components/shared/LoadingState";

type SpinnerProps = {
	className?: string;
	size?: "sm" | "md" | "lg";
};

export function Spinner({ className, size = "sm" }: SpinnerProps) {
	return <LoadingState type="spinner" className={className} size={size} variant="inline" />;
}
