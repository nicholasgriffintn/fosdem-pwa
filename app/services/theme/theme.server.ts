import type { CustomSession } from '~/services/session';
import { Theme, isTheme } from '~/lib/theme-provider';

export const getThemeFromSession = async (session: CustomSession) => {
  return {
    getTheme: () => {
      const themeValue = session.get('theme');
      return isTheme(themeValue) ? themeValue : null;
    },
    setTheme: (theme: Theme) => session.set('theme', theme),
  };
};
