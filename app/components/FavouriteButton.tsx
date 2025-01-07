"use client";

import { useState, useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { Spinner } from "~/components/Spinner";
import type { User } from "~/server/db/schema";

type FavouriteButtonProps = {
  year: number;
  type: string;
  slug: string;
  status: string;
  user: User | null;
  onCreateBookmark: ({
    type,
    slug,
    status,
  }: {
    type: string;
    slug: string;
    status: string;
  }) => void;
};

export function FavouriteButton({
  year,
  type,
  slug,
  status,
  user,
  onCreateBookmark,
}: FavouriteButtonProps) {
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const handleFavourite = () => {
    if (!user) {
      toast({
        title: "You must be signed in to favourite",
        variant: "destructive",
      });
      return;
    }

    if (onCreateBookmark) {
      onCreateBookmark({
        type,
        slug,
        status: currentStatus === "favourited" ? "unfavourited" : "favourited",
      });

      setCurrentStatus(
        currentStatus === "favourited" ? "unfavourited" : "favourited",
      );

      toast({
        title: currentStatus === "favourited" ? "Unfavourited" : "Favourited",
        description: "You can undo this action by clicking the button again",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleFavourite}
      disabled={currentStatus === "loading"}
    >
      {currentStatus === "loading" ? (
        <Spinner />
      ) : (
        <Icons.star
          className={currentStatus === "favourited" ? "icon--filled" : ""}
        />
      )}
    </Button>
  );
}
