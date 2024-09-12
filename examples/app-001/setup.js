/// <reference types="vite/client"/>
/// <reference types="@adbl/bullet/library/jsx-runtime" />

import { setup } from '@adbl/bullet';

export const { createElement } = setup({
  namespace: 'ssr',
});
