import { constants } from '~/constants';
import { xml2json } from 'xml-js';

function flattenSchedule(element: unknown) {
  if (Array.isArray(element)) {
    return element.map(flattenSchedule);
  }

  if (typeof element === 'object' && element !== null) {
    const result: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(element)) {
      result[key] = flattenSchedule(value);
    }
    return result;
  }

  return element;
}

async function parseSchedule(text: string) {
  const data = await xml2json(text, {
    compact: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    ignoreComment: true,
    ignoreDoctype: true,
    ignoreCdata: true,
    textFn: (value) => value.trim(),
  });

  const parsed = JSON.parse(data);
  const result = flattenSchedule(parsed.schedule);

  return result;
}

export async function getSchedule({ year }: { year: string }) {
  const url = constants.SCHEDULE_LINK.replace('${YEAR}', year);
  const response = await fetch(url);
  const text = await response.text();
  const data = await parseSchedule(text);
  return data;
}
