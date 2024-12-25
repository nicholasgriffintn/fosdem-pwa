/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SigninImport } from './routes/signin'
import { Route as BookmarksImport } from './routes/bookmarks'
import { Route as IndexImport } from './routes/index'
import { Route as ProfileIndexImport } from './routes/profile/index'
import { Route as MapIndexImport } from './routes/map/index'
import { Route as LiveIndexImport } from './routes/live/index'
import { Route as TypeSlugImport } from './routes/type/$slug'
import { Route as TrackSlugImport } from './routes/track/$slug'
import { Route as EventSlugImport } from './routes/event/$slug'
import { Route as ProfileUserIdIndexImport } from './routes/profile/$userId/index'

// Create/Update Routes

const SigninRoute = SigninImport.update({
  id: '/signin',
  path: '/signin',
  getParentRoute: () => rootRoute,
} as any)

const BookmarksRoute = BookmarksImport.update({
  id: '/bookmarks',
  path: '/bookmarks',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ProfileIndexRoute = ProfileIndexImport.update({
  id: '/profile/',
  path: '/profile/',
  getParentRoute: () => rootRoute,
} as any)

const MapIndexRoute = MapIndexImport.update({
  id: '/map/',
  path: '/map/',
  getParentRoute: () => rootRoute,
} as any)

const LiveIndexRoute = LiveIndexImport.update({
  id: '/live/',
  path: '/live/',
  getParentRoute: () => rootRoute,
} as any)

const TypeSlugRoute = TypeSlugImport.update({
  id: '/type/$slug',
  path: '/type/$slug',
  getParentRoute: () => rootRoute,
} as any)

const TrackSlugRoute = TrackSlugImport.update({
  id: '/track/$slug',
  path: '/track/$slug',
  getParentRoute: () => rootRoute,
} as any)

const EventSlugRoute = EventSlugImport.update({
  id: '/event/$slug',
  path: '/event/$slug',
  getParentRoute: () => rootRoute,
} as any)

const ProfileUserIdIndexRoute = ProfileUserIdIndexImport.update({
  id: '/profile/$userId/',
  path: '/profile/$userId/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/bookmarks': {
      id: '/bookmarks'
      path: '/bookmarks'
      fullPath: '/bookmarks'
      preLoaderRoute: typeof BookmarksImport
      parentRoute: typeof rootRoute
    }
    '/signin': {
      id: '/signin'
      path: '/signin'
      fullPath: '/signin'
      preLoaderRoute: typeof SigninImport
      parentRoute: typeof rootRoute
    }
    '/event/$slug': {
      id: '/event/$slug'
      path: '/event/$slug'
      fullPath: '/event/$slug'
      preLoaderRoute: typeof EventSlugImport
      parentRoute: typeof rootRoute
    }
    '/track/$slug': {
      id: '/track/$slug'
      path: '/track/$slug'
      fullPath: '/track/$slug'
      preLoaderRoute: typeof TrackSlugImport
      parentRoute: typeof rootRoute
    }
    '/type/$slug': {
      id: '/type/$slug'
      path: '/type/$slug'
      fullPath: '/type/$slug'
      preLoaderRoute: typeof TypeSlugImport
      parentRoute: typeof rootRoute
    }
    '/live/': {
      id: '/live/'
      path: '/live'
      fullPath: '/live'
      preLoaderRoute: typeof LiveIndexImport
      parentRoute: typeof rootRoute
    }
    '/map/': {
      id: '/map/'
      path: '/map'
      fullPath: '/map'
      preLoaderRoute: typeof MapIndexImport
      parentRoute: typeof rootRoute
    }
    '/profile/': {
      id: '/profile/'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof ProfileIndexImport
      parentRoute: typeof rootRoute
    }
    '/profile/$userId/': {
      id: '/profile/$userId/'
      path: '/profile/$userId'
      fullPath: '/profile/$userId'
      preLoaderRoute: typeof ProfileUserIdIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/bookmarks': typeof BookmarksRoute
  '/signin': typeof SigninRoute
  '/event/$slug': typeof EventSlugRoute
  '/track/$slug': typeof TrackSlugRoute
  '/type/$slug': typeof TypeSlugRoute
  '/live': typeof LiveIndexRoute
  '/map': typeof MapIndexRoute
  '/profile': typeof ProfileIndexRoute
  '/profile/$userId': typeof ProfileUserIdIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/bookmarks': typeof BookmarksRoute
  '/signin': typeof SigninRoute
  '/event/$slug': typeof EventSlugRoute
  '/track/$slug': typeof TrackSlugRoute
  '/type/$slug': typeof TypeSlugRoute
  '/live': typeof LiveIndexRoute
  '/map': typeof MapIndexRoute
  '/profile': typeof ProfileIndexRoute
  '/profile/$userId': typeof ProfileUserIdIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/bookmarks': typeof BookmarksRoute
  '/signin': typeof SigninRoute
  '/event/$slug': typeof EventSlugRoute
  '/track/$slug': typeof TrackSlugRoute
  '/type/$slug': typeof TypeSlugRoute
  '/live/': typeof LiveIndexRoute
  '/map/': typeof MapIndexRoute
  '/profile/': typeof ProfileIndexRoute
  '/profile/$userId/': typeof ProfileUserIdIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/bookmarks'
    | '/signin'
    | '/event/$slug'
    | '/track/$slug'
    | '/type/$slug'
    | '/live'
    | '/map'
    | '/profile'
    | '/profile/$userId'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/bookmarks'
    | '/signin'
    | '/event/$slug'
    | '/track/$slug'
    | '/type/$slug'
    | '/live'
    | '/map'
    | '/profile'
    | '/profile/$userId'
  id:
    | '__root__'
    | '/'
    | '/bookmarks'
    | '/signin'
    | '/event/$slug'
    | '/track/$slug'
    | '/type/$slug'
    | '/live/'
    | '/map/'
    | '/profile/'
    | '/profile/$userId/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  BookmarksRoute: typeof BookmarksRoute
  SigninRoute: typeof SigninRoute
  EventSlugRoute: typeof EventSlugRoute
  TrackSlugRoute: typeof TrackSlugRoute
  TypeSlugRoute: typeof TypeSlugRoute
  LiveIndexRoute: typeof LiveIndexRoute
  MapIndexRoute: typeof MapIndexRoute
  ProfileIndexRoute: typeof ProfileIndexRoute
  ProfileUserIdIndexRoute: typeof ProfileUserIdIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  BookmarksRoute: BookmarksRoute,
  SigninRoute: SigninRoute,
  EventSlugRoute: EventSlugRoute,
  TrackSlugRoute: TrackSlugRoute,
  TypeSlugRoute: TypeSlugRoute,
  LiveIndexRoute: LiveIndexRoute,
  MapIndexRoute: MapIndexRoute,
  ProfileIndexRoute: ProfileIndexRoute,
  ProfileUserIdIndexRoute: ProfileUserIdIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/bookmarks",
        "/signin",
        "/event/$slug",
        "/track/$slug",
        "/type/$slug",
        "/live/",
        "/map/",
        "/profile/",
        "/profile/$userId/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/bookmarks": {
      "filePath": "bookmarks.tsx"
    },
    "/signin": {
      "filePath": "signin.tsx"
    },
    "/event/$slug": {
      "filePath": "event/$slug.tsx"
    },
    "/track/$slug": {
      "filePath": "track/$slug.tsx"
    },
    "/type/$slug": {
      "filePath": "type/$slug.tsx"
    },
    "/live/": {
      "filePath": "live/index.tsx"
    },
    "/map/": {
      "filePath": "map/index.tsx"
    },
    "/profile/": {
      "filePath": "profile/index.tsx"
    },
    "/profile/$userId/": {
      "filePath": "profile/$userId/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
