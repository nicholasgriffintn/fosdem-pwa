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
}: {
  types: {
    [key: string]: {
      id: string;
      name: string;
      trackCount: number;
    };
  };
}) {
  const navigate = useNavigate();

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
                <CardTitle>{types[typeKey].name}</CardTitle>
                <CardDescription>
                  {types[typeKey].trackCount} TRACKS
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <img
                  src={`/images/${types[typeKey].id}.png`}
                  alt={types[typeKey].name}
                  className="w-full"
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/type/${types[typeKey].id}`)}
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
