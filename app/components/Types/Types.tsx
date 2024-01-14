import { useNavigate } from '@remix-run/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export function Types({
  types,
  tracks,
}: {
  types: {
    [key: string]: {
      id: string;
      name: string;
    };
  }[];
  tracks: {
    [key: string]: {
      name: string;
      type: string;
    };
  };
}) {
  const navigate = useNavigate();

  return (
    <ul className="flex flex-wrap -mx-1 lg:-mx-4">
      {types.map((type: unknown) => {
        const track = Object.values(tracks).filter(
          (track) => track.type === type.id
        );

        return (
          <li
            key={type.id}
            className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
          >
            <Card className="lg:max-w-md w-full">
              <CardHeader>
                <CardTitle>{type.name}</CardTitle>
                <CardDescription>{track.length} TRACKS</CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <img
                  src={`/images/${type.id}.png`}
                  alt={type.name}
                  className="w-full"
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/${type.id}`)}
                >
                  View Track
                </Button>
              </CardFooter>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
