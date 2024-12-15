'use client';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/hooks/use-toast';

export const shareSupported = () => {
  try {
    return 'share' in navigator;
  } catch (error) {
    return false;
  }
};

export function ShareButton({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}) {
  const handleShare = async () => {
    toast({
      title: 'Sharing not supported',
      description: 'Not implemented yet',
    });
  };

  return (
    <Button variant="ghost" onClick={handleShare}>
      <Icons.share />
    </Button>
  );
}