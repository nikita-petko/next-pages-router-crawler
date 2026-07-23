export default function getWindowSizes(): { viewportWidth: number; viewportHeight: number } {
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
