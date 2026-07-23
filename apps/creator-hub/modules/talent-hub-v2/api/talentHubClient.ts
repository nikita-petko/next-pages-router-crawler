import {
  ApplicationsApi,
  JobsApi,
  ResumesApi,
  StudiosApi,
  TalentProfilesApi,
  TalentSignalsApi,
} from '@rbx/client-talent-hub-v2-service/v2';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('talent-hub-v2-service', 'bedev2');

export const jobsApi = new JobsApi(configuration);
export const studiosApi = new StudiosApi(configuration);
export const talentProfilesApi = new TalentProfilesApi(configuration);
export const applicationsApi = new ApplicationsApi(configuration);
export const talentSignalsApi = new TalentSignalsApi(configuration);
export const resumesApi = new ResumesApi(configuration);
