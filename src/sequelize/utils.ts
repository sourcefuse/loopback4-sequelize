/**
 * Function to check if the `value` is actually an js object (`{}`)
 * @param value Target value to check
 * @returns `true` is it is an object `false` otherwise
 */
export const isTruelyObject = (value?: unknown) => {
  return typeof value === 'object' && !Array.isArray(value) && value !== null;
};
