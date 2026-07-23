import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class ThumbnailsClient extends BaseClient {
  protected baseURL = `https://thumbnails.${GetSitetestBaseUrl()}/v1`;
}

const thumbnailsClient = new ThumbnailsClient();

export default thumbnailsClient;
