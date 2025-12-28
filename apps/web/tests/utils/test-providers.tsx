import type { ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "~/components/ui/tooltip";

function AllProviders({ children }: { children: ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

export function renderWithProviders(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) {
	return render(ui, { wrapper: AllProviders, ...options });
}
