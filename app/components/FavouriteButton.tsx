'use client';

import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/hooks/use-toast';
import { useAuth } from '~/hooks/use-auth';

export function FavouriteButton({
  type,
  slug,
  status,
}: {
  type: string;
  slug: string;
  status: string;
}) {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleFavourite = () => {
    if (!user) {
      toast({
        title: 'You must be signed in to favourite',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Favouriting not supported',
      description: 'Not implemented yet',
    });
  };

  return (
    <Button variant="outline" onClick={handleFavourite}>
      <Icons.star
        className={currentStatus === 'favourited' ? 'icon--filled' : ''}
      />
    </Button>
  );
}