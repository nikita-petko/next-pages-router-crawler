import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class AccountInformationClient extends BaseClient {
  protected baseURL = `https://accountinformation.${GetSitetestBaseUrl()}`;
}

const accountInformationClient = new AccountInformationClient();

export default accountInformationClient;
