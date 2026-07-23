import accountInformationClient from '@clients/accountInformation';

export const sendEmailVerifyRequestWithTicket = async (body: Record<string, unknown>) =>
  accountInformationClient.post({ body, url: '/v1/email/verify' });
