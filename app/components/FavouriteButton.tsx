'use client';

import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/hooks/use-toast';
import { useAuth } from '~/hooks/use-auth';
import { useBookmarks } from '~/hooks/use-bookmarks';

export function FavouriteButton({
  year,
  type,
  slug,
  status,
}: {
  year: number;
  type: string;
  slug: string;
  status: string;
}) {
  const { user } = useAuth();
  const { create } = useBookmarks({ year });
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleFavourite = () => {
    if (!user) {
      toast({
        title: 'You must be signed in to favourite',
        variant: 'destructive',
      });
      return;
    }

    create({
      type,
      slug,
      status: currentStatus === 'favourited' ? 'unfavourited' : 'favourited',
    });

    setCurrentStatus(currentStatus === 'favourited' ? 'unfavourited' : 'favourited');

    toast({
      title: currentStatus === 'favourited' ? 'Unfavourited' : 'Favourited',
      description: 'You can undo this action by clicking the button again',
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