import { Link } from "@tanstack/react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { FeaturedFosdemImage } from '~/components/FeaturedFosdemImage';
import { constants } from '~/constants';

type FosdemImageType = "keynote" | "maintrack" | "devroom" | "lightningtalk" | "other";

export function Types({
  types,
}: {
  types: {
    [key: string]: {
      id: FosdemImageType;
      name: string;
      trackCount: number;
    };
  };
}) {
  const typeKeys = Object.keys(types);

  return (
    <ul className="flex flex-wrap -mx-1 lg:-mx-4">
      {typeKeys.map((typeKey: string) => {
        return (
          <li
            key={types[typeKey].id}
            className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
          >
            <Card className="lg:max-w-md w-full">
              <CardHeader>
                <CardTitle>
                  <Link search={(prev) => ({ ...prev, year: prev.year || constants.DEFAULT_YEAR })} to={`/type/${types[typeKey].id}`} className="no-underline">
                    {types[typeKey].name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {types[typeKey].trackCount} TRACKS
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full hidden md:block">
                <div className="min-h-[302px] bg-muted rounded-md">
                  <FeaturedFosdemImage
                    type={types[typeKey].id}
                    size="featured"
                    className="w-full rounded-md"
                    loading="lazy"
                    showCaptionOnHover
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" asChild className="w-full no-underline">
                  <Link search={(prev) => ({ ...prev, year: prev.year || constants.DEFAULT_YEAR })} to={`/type/${types[typeKey].id}`}>View Tracks</Link>
                </Button>
              </CardFooter>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}