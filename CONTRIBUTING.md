# Contributing

I'm more than happy to accept contributions to this project, so please feel free to open issues or pull requests.

Before you do though, please read the [Code of Conduct](CODE_OF_CONDUCT.md) and the rest of this document.

## Useful links

- [Remix Docs](https://remix.run/docs)
- [Shadcn UI Docs](https://ui.shadcn.com/)
- [FOSDEM 2024](https://fosdem.org/2024/)
- [Remix PWA](https://remix-pwa.run/)

## Development

From your terminal:

```sh
pnpm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
pnpm run build
```

Then run the app in production mode:

```sh
pnpm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`