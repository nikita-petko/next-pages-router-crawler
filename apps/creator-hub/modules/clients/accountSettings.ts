import { EmailApi } from '@rbx/client-accountsettings/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const emailApi = new EmailApi(createClientConfiguration('accountsettings', 'bedev1'));

export const AccountSettingsClient = { emailApi };
