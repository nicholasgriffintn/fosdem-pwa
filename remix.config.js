/** @type {import('@remix-run/dev').AppConfig} */
/** @type {import('@remix-pwa/dev').WorkerConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  server: './server.ts',
  serverBuildPath: 'functions/[[path]].js',
  serverConditions: ['workerd', 'worker', 'browser'],
  serverDependenciesToBundle: 'all',
  serverMainFields: ['browser', 'module', 'main'],
  serverMinify: true,
  serverModuleFormat: 'esm',
  serverPlatform: 'neutral',
  tailwind: true,
  postcss: true,
  browserNodeBuiltinsPolyfill: {
    modules: { string_decoder: true, stream: true },
  },
};
