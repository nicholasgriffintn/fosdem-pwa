'use client';

import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/hooks/use-toast';

export function FavouriteButton({
  type,
  slug,
  status,
}: {
  type: string;
  slug: string;
  status: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleFavourite = () => {
    toast({
      title: 'Favouriting not supported',
      description: 'Not implemented yet',
    });
  };

  return (
    <Button variant="ghost" onClick={() => handleFavourite()}>
      <Icons.star
        className={currentStatus === 'favourited' ? 'icon--filled' : ''}
      />
    </Button>
  );
}