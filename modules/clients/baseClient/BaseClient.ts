import { Configuration, Middleware, ResponseContext } from '@rbx/clients-core';

// total attempts is 1 + MAX_RETRIES (1 is the initial attempt).
const MAX_RETRIES = 4;

class BaseClient {
  protected defaultConfiguration: Configuration;

  private retryAttempts = new Map<string, number>();

  constructor(basePath: string, retries = MAX_RETRIES) {
    const middleware: Middleware = {
      post: async ({ fetch, init, response, url }: ResponseContext) => {
        if (response.status >= 500) {
          const retryCount = this.retryAttempts.get(url) || 0;

          if (retryCount < retries) {
            const timeToWait = 2 ** retryCount * 1000;
            this.retryAttempts.set(url, retryCount + 1);
            await new Promise((resolve) => setTimeout(resolve, timeToWait));
            // eslint-disable-next-line no-return-await
            return await fetch(url, init);
          }
        }

        this.retryAttempts.delete(url);
        return response;
      },
    };

    this.defaultConfiguration = new Configuration({
      basePath,
      credentials: 'include',
      middleware: [middleware],
    });
  }
}

export default BaseClient;
