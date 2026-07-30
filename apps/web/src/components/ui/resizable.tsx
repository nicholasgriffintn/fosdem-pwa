import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "~/lib/utils";

const serverStorage: ResizablePrimitive.LayoutStorage = {
	getItem: () => null,
	setItem: () => undefined,
};

interface ResizablePanelGroupProps
	extends React.ComponentProps<typeof ResizablePrimitive.Group> {
	autoSaveId: string;
	panelIds: string[];
}

const ResizablePanelGroup = ({
	autoSaveId,
	className,
	panelIds,
	...props
}: ResizablePanelGroupProps) => {
	const { defaultLayout, onLayoutChanged } = ResizablePrimitive.useDefaultLayout({
		id: autoSaveId,
		panelIds,
		storage:
			typeof localStorage === "undefined" ? serverStorage : localStorage,
	});

	return (
		<ResizablePrimitive.Group
			className={cn("flex h-full w-full", className)}
			defaultLayout={defaultLayout}
			id={autoSaveId}
			onLayoutChanged={onLayoutChanged}
			{...props}
		/>
	);
};

const ResizablePanel = ResizablePrimitive.Panel;

interface ResizableHandleProps
	extends React.ComponentProps<typeof ResizablePrimitive.Separator> {
	withHandle?: boolean;
}

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: ResizableHandleProps) => (
	<ResizablePrimitive.Separator
		className={cn(
			"relative flex w-px self-stretch items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:self-auto aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="js-only z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
