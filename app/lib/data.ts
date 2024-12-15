import fs from 'node:fs';

export function getFosdemData(year: string) {
  const data = fs.readFileSync(`public/data/fosdem-${year}.json`, 'utf8');
  return JSON.parse(data);
}
