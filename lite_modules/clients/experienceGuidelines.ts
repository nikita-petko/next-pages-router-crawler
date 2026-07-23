import BaseClient from '@clients/base';
import { GetBEDEV2ServiceBasePath } from '@utils/url';

class ExperienceGuidelinesClient extends BaseClient {
  protected baseURL = `${GetBEDEV2ServiceBasePath('experience-guidelines-api')}/experience-guidelines`;
}

const experienceGuidelinesClient = new ExperienceGuidelinesClient();

export default experienceGuidelinesClient;
