import fs from 'node:fs';

import { buildData } from '~/lib/fosdem';

async function runBuildData() {
  const data = await buildData({ year: '2025' });
  fs.writeFileSync('public/data/fosdem-2025.json', JSON.stringify(data, null, 2));
}

runBuildData();
