import type { CustomSession } from '~/services/session';

const randomUsername = () => {
  const a = ['Small', 'Blue', 'Ugly'];
  const b = ['Bear', 'Dog', 'Banana'];

  const rA = Math.floor(Math.random() * a.length);
  const rB = Math.floor(Math.random() * b.length);

  const name = a[rA] + b[rB];

  return name;
};

export const getUserFromSession = async (session: CustomSession) => {
  return {
    getUser: () => {
      // TODO: Add something here to get user information
      const userValue = session.get('user');
      return userValue ? userValue : null;
    },
    setUser: () => {
      // TODO: Add something here to set user information
      return session.set('user', {
        id: randomUsername(),
      });
    },
  };
};
