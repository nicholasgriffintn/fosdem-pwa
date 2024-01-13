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

export function Tracks({ tracks }: { tracks: unknown }) {
  const navigate = useNavigate();

  return (
    <ul className="flex flex-wrap -mx-1 lg:-mx-4">
      {tracks.map((track: unknown) => {
        return (
          <li
            key={track.id}
            className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
          >
            <Card className="lg:max-w-md w-full">
              <CardHeader>
                <CardTitle>{track.name}</CardTitle>
                <CardDescription>{track.rooms.length} ROOMS</CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <img
                  src={`/images/${track.id}.png`}
                  alt={track.name}
                  className="w-full"
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/tracks/${track.id}`)}
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
