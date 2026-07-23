export function validate(enu: Record<string, string>, str: string) {
  return Object.values(enu).includes(str);
}

export default { validate };
