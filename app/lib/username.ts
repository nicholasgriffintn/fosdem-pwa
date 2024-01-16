import { generate } from 'random-words';

export const randomUsername = (): string => {
  const words = generate({ exactly: 3, join: '_' });

  return words;
};
