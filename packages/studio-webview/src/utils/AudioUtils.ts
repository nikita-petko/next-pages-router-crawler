export const DEFAULT_STUDIO_VOLUME = 1;

export function isMediaElement(element: Element): element is HTMLMediaElement {
  return element.tagName === 'AUDIO' || element.tagName === 'VIDEO';
}

export function updateMediaElementsVolume(parentElement: Element, volume: number) {
  const videoElements = parentElement.getElementsByTagName('video');
  const audioElements = parentElement.getElementsByTagName('audio');

  if (videoElements.length > 0) {
    Array.from(videoElements).forEach((elem: HTMLVideoElement) => {
      const mediaElement = elem;
      mediaElement.volume = volume;
    });
  }
  if (audioElements.length > 0) {
    Array.from(audioElements).forEach((elem: HTMLAudioElement) => {
      const mediaElement = elem;
      mediaElement.volume = volume;
    });
  }
}

export function createVolumeMutationObserver(getCurrentStudioVolume: () => number) {
  return new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // the node itself is the media element
            if (isMediaElement(element)) {
              element.volume = getCurrentStudioVolume();
            }

            // or update children media elements
            if (element.children.length > 0) {
              updateMediaElementsVolume(element, getCurrentStudioVolume());
            }
          }
        });
      }
    });
  });
}
