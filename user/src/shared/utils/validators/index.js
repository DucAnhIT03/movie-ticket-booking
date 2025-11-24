export const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
export const minLen = (str, n) => (str || '').length >= n;
export const notEmpty = (str) => Boolean((str || '').trim());
