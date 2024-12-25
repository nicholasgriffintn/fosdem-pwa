import { useOnlineStatus } from '~/hooks/use-online-status';
import { cn } from '~/lib/utils';
import { Icons } from './Icons';

export function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className={cn(
            'fixed bottom-4 right-4 z-50',
            'flex items-center gap-2 px-4 py-2 rounded-md',
            'bg-destructive text-destructive-foreground'
        )}>
            <Icons.wifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You are offline</span>
        </div>
    );
}