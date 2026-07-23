export function validate<T extends Record<string, string>>(enu: T, str: string): str is T[keyof T] {
  return Object.values(enu).includes(str);
}

export default { validate };
