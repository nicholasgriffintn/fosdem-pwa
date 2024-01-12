/** @type {import('@remix-run/dev').AppConfig} */
/** @type {import('@remix-pwa/dev').WorkerConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  tailwind: true,
  postcss: true,
  browserNodeBuiltinsPolyfill: {
    modules: { string_decoder: true, stream: true },
  },
  serverDependenciesToBundle: [/@remix-pwa\/.*/],
};
