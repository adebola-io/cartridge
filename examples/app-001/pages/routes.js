import { createWebRouter, defineRoutes, lazy } from '@adbl/bullet';

export const define = () => {
  const router = createWebRouter({
    routes: defineRoutes([
      {
        name: 'home',
        path: '/',
        title: 'Home Page',
        component: lazy(() => import('./home.jsx')),
      },
      {
        name: 'about',
        path: '/about',
        title: 'About Me',
        component: lazy(() => import('./about.jsx')),
      },
    ]),
  });

  return router;
};
