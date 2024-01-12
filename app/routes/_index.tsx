import type { MetaFunction } from '@remix-run/node';
import { Await, useRouteLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'FOSDEM 2024' },
    { name: 'description', content: 'A companion PWA for FOSDEM 2024' },
  ];
};

export default function Index() {
  const { fosdem } = useRouteLoaderData('root');

  return (
    <div className="min-h-screen">
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <header className="flex flex-col items-center justify-center">
            <h1 className="">Welcome to {fosdem.conference.title._text}!</h1>
          </header>
          <Await resolve={fosdem}>
            {(data) => {
              console.log(data);

              return (
                <div>
                  {data.tracks.map((track) => {
                    return (
                      <div key={track.id}>
                        <img src={`/images/${track.id}.png`} alt={track.name} />
                        <h2>{track.name}</h2>
                        <p>{track.rooms.length} ROOMS</p>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
