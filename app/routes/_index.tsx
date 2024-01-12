import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'FOSDEM 2024' },
    { name: 'description', content: 'A companion PWA for FOSDEM 2024' },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen">
      <div className="py-20">
        <h1 className="text-4xl font-bold text-center">Hello World!</h1>
      </div>
    </div>
  );
}
