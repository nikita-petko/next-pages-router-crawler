/**
 * Monaco's ColorMap only accepts 6/8-digit hex strings (#RRGGBB or #RRGGBBAA).
 * Theme palette values may resolve to rgb(...) at runtime, so we need to convert.
 */
export const toHexColor = (color: string): string => {
  if (color.startsWith('#')) {
    return color;
  }

  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    return color;
  }

  const [, r, g, b] = match;
  return `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`;
};
