'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '~/hooks/use-online-status';
import { cn } from '~/lib/utils';
import { Icons } from './Icons';

export function OfflineIndicator() {
    const [isMounted, setIsMounted] = useState(false);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    if (isOnline) return null;

    return (
        <div className={cn(
            'fixed bottom-4 right-4 z-50',
            'flex items-center gap-2 px-4 py-2 rounded-md',
            'bg-destructive text-destructive-foreground'
        )}>
            <Icons.wifi className="h-4 w-4" />
            <span className="text-sm font-medium">You are offline</span>
        </div>
    );
}