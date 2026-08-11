// NOTE(lucaswang, 09/05/2025): https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript

let cachedContext: CanvasRenderingContext2D | null | undefined;

const getCanvasContext = (): CanvasRenderingContext2D | null => {
  if (cachedContext !== undefined) {
    return cachedContext;
  }
  if (typeof document === 'undefined') {
    cachedContext = null;
    return null;
  }
  const canvas = document.createElement('canvas');
  cachedContext = canvas.getContext('2d');
  return cachedContext;
};

const measureTextWidth = (text: string, fontSize: number, fontFamily: string = 'Arial'): number => {
  const context = getCanvasContext();
  if (!context || typeof context.measureText !== 'function') {
    return text.length * fontSize * 0.6;
  }
  context.font = `${fontSize}px ${fontFamily}`;
  return context.measureText(text).width;
};

export default measureTextWidth;
