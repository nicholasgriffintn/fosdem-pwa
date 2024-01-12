/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  tailwind: true,
  postcss: true,
  browserNodeBuiltinsPolyfill: {
    modules: { string_decoder: true, stream: true },
  },
};
