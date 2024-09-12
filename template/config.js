const isProduction = process.env.NODE_ENV === 'production';
const base = process.env.BASE || '/';

export default {
  isProduction,
  base,
};
