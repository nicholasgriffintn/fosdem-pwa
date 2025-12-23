import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "~/lib/utils";

const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
	<ResizablePrimitive.PanelGroup
		className={cn(
			"flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
			className,
		)}
		{...props}
	/>
);

const ResizablePanel = ResizablePrimitive.Panel;

interface ResizablePanelProps extends React.ComponentProps<typeof ResizablePrimitive.Panel> {
	['data-panel-group-direction']?: 'horizontal' | 'vertical';
	['aria-valuenow']?: number;
	['aria-valuemin']?: number;
	['aria-valuemax']?: number;
	withHandle?: boolean;
}

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: ResizablePanelProps) => (
	// @ts-ignore
	<ResizablePrimitive.PanelResizeHandle
		aria-label={(props as Record<string, unknown>)?.["aria-label"] as string | undefined}
		aria-orientation={
			props["data-panel-group-direction"] ?? "horizontal"
		}
		aria-valuemin={
			props["aria-valuemin"] ?? 0
		}
		aria-valuemax={
			props["aria-valuemax"] ?? 100
		}
		aria-valuenow={
			props["aria-valuenow"] ?? 50
		}
		className={cn(
			"relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="js-only z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
