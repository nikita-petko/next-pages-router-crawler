type GenericFunction<Args extends unknown[], ReturnType> = (...args: Args) => ReturnType;

export const escapeHtmlString = (str: string): string => {
  return str
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/"/g, '&quot;')
    .replaceAll(/'/g, '&#039;');
};

export const escapeHtmlFn = <Args extends unknown[]>(
  fn: GenericFunction<Args, string>,
): GenericFunction<Args, string> => {
  return function escape(...args: Args): string {
    const result = fn(...args);
    return escapeHtmlString(result);
  };
};
