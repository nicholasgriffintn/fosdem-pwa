import type { MetaFunction } from '@remix-run/node';
import { Await, useRouteLoaderData, useNavigate } from '@remix-run/react';
import { Suspense } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export const meta: MetaFunction = () => {
  return [
    { title: 'FOSDEM 2024' },
    { name: 'description', content: 'A companion PWA for FOSDEM 2024' },
  ];
};

export default function Index() {
  const navigate = useNavigate();
  const { fosdem } = useRouteLoaderData('root');

  return (
    <div className="min-h-screen">
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <Await resolve={fosdem}>
            {(data) => {
              console.log(data);

              return (
                <ul>
                  {data.tracks.map((track) => {
                    return (
                      <li key={track.id}>
                        <Card className="lg:max-w-md w-full">
                          <CardContent>
                            <img
                              src={`/images/${track.id}.png`}
                              alt={track.name}
                              className="w-full"
                            />
                          </CardContent>
                          <CardHeader>
                            <CardTitle>{track.name}</CardTitle>
                            <CardDescription>
                              {track.rooms.length} ROOMS
                            </CardDescription>
                          </CardHeader>
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
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
