import debounce from 'lodash.debounce';

export type FrameMessageQueueOptions = {
  flushInterval?: number;
  frameRemoveDelay?: number;
  maxUrlLength?: number;
};

export default class FrameMessageQueue {
  private debouncedFlush: () => void;

  private frameRemoveDelay: number;

  private maxUrlLength: number;

  private queue: string[] = [];

  private url: string;

  constructor(url: string, options: FrameMessageQueueOptions = {}) {
    const { flushInterval = 10, frameRemoveDelay = 10, maxUrlLength = 64000 } = options;
    this.url = url;
    this.frameRemoveDelay = frameRemoveDelay;
    this.maxUrlLength = maxUrlLength;
    this.debouncedFlush = debounce(() => this.flush(), flushInterval);
  }

  public enqueueMessage(message: string) {
    this.queue.push(message);
    this.debouncedFlush();
  }

  private flush() {
    let url = `${this.url}?`;
    let messageCount = 0;

    for (const message of this.queue) {
      const messageParam = `msg${messageCount}=${encodeURIComponent(message)}&`;
      const potentialUrl = url + messageParam;

      if (potentialUrl.length > this.maxUrlLength) {
        // URL would exceed max length
        if (messageCount > 0) {
          // Flush what we have so far, then continue with this message
          this.queue = this.queue.slice(messageCount);
          this.postFrameMessage(url);
          this.debouncedFlush();
          return;
        }

        // Single message is too large - attempt to send it anyway
        console.warn(`Message too large: (${potentialUrl.length}), attempting to send anyway`);
        this.queue = this.queue.slice(1);
        this.postFrameMessage(potentialUrl);

        // Schedule processing of remaining messages
        if (this.queue.length > 0) {
          this.debouncedFlush();
        }
        return;
      }

      url = potentialUrl;
      messageCount += 1;
    }

    if (messageCount > 0) {
      this.queue = this.queue.slice(messageCount);
      this.postFrameMessage(url);
    }
  }

  private postFrameMessage(url: string) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, this.frameRemoveDelay);
  }
}
