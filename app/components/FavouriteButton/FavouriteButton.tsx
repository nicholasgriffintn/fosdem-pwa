import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';

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

  const favouriteFetcher = useFetcher();

  const handleFavourite = () => {
    const newStatus =
      currentStatus === 'favourited' ? 'unfavourited' : 'favourited';

    setCurrentStatus(newStatus);

    favouriteFetcher.submit(
      { type, slug, status: newStatus },
      { action: '/action/favourite-item', method: 'post' }
    );
  };

  return (
    <Button variant="ghost" onClick={() => handleFavourite()}>
      <Icons.star
        className={currentStatus === 'favourited' ? 'icon--filled' : ''}
      />
    </Button>
  );
}
