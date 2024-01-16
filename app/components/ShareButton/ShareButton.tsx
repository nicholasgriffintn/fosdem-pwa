import {
  shareData,
  clipboardSupported,
  copyTextToClipboard,
} from '@remix-pwa/client';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/components/ui/use-toast';

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
    if (shareSupported()) {
      await shareData({
        title,
        text: text,
        url: url,
      });
    } else if (clipboardSupported) {
      await copyTextToClipboard(url);
      toast({
        title: 'Copied to clipboard',
        description: 'The URL has been copied to your clipboard',
      });
    } else {
      toast({
        title: 'Sharing not supported',
        description: 'Sharing is not supported on this device',
      });
    }
  };

  return (
    <Button variant="ghost" onClick={handleShare}>
      <Icons.share />
    </Button>
  );
}
