'use client';

import { useEffect } from 'react';
import { toast } from '~/hooks/use-toast';
import { Button } from '~/components/ui/button';

export function ServiceWorkerUpdater() {
    useEffect(() => {
        const handleSwUpdate = () => {
            toast({
                title: 'Update Available',
                description: 'A new version is available. Click to update.',
                duration: 0,
                action: (
                    <Button
                        variant="outline"
                        onClick={() => {
                            navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }}
                    >
                        Update
                    </Button>
                ),
            });
        };

        window.addEventListener('swUpdated', handleSwUpdate);
        return () => window.removeEventListener('swUpdated', handleSwUpdate);
    }, []);

    return null;
}