'use client';

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

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
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleFavourite = () => {
    if (!user) {
      toast({
        title: 'You must be signed in to favourite',
        variant: 'destructive',
      });
      navigate({ to: '/signin' });
      return;
    }

    toast({
      title: 'Favouriting not supported',
      description: 'Not implemented yet',
    });
  };

  return (
    <Button variant="ghost" onClick={handleFavourite}>
      <Icons.star
        className={currentStatus === 'favourited' ? 'icon--filled' : ''}
      />
    </Button>
  );
}