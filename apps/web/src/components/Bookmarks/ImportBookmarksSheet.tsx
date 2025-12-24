import { useRef } from "react";
import { Button } from "~/components/ui/button";
import { Icons } from "~/components/shared/Icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

type ImportBookmarksSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  disabled?: boolean;
  busy?: boolean;
};

export function ImportBookmarksSheet({
  open,
  onOpenChange,
  onImport,
  disabled = false,
  busy = false,
}: ImportBookmarksSheetProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    await onImport(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleFileChange}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Import bookmarks from CSV</SheetTitle>
            <SheetDescription>
              Upload a CSV containing event and/or track IDs. Import requires
              you to be signed in.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="text-sm space-y-2">
              <p>Accepted formats:</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
                type,id,priority{"\n"}event,12345,2{"\n"}track,devroom-foo,
              </pre>
              <p>Or IDs only (one per line):</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
                12345,2{"\n"}devroom-foo
              </pre>
              <p className="text-muted-foreground">
                If a third column is present, it will be treated as event
                priority.
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={busy || disabled}
              onClick={() => inputRef.current?.click()}
              className="w-full"
            >
              <Icons.upload className="h-4 w-4" />
              Choose CSV file
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
