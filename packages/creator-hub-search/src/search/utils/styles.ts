export const textClamp = (line = 1): Record<string, string | number> => {
  if (line === 1) {
    return {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
  }

  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // line-clamp isn't yet supported by all browsers, so dual-write webkit-specific properties
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp
    display: '-webkit-box',
    WebkitLineClamp: line,
    WebkitBoxOrient: 'vertical',
    lineClamp: line,
    boxOrient: 'vertical',
  };
};

export default {
  textClamp,
};
