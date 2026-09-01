import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

export type AmpServiceResponseStatusResults = {
  status: string | null; // "Actionable" "Granted" "Denied"
};

async function fetchUserAmpStatus(featureName: string): Promise<string> {
  const baseURL = getBEDEV2ServiceBasePath('access-management');
  const url = `${baseURL}/v1/feature-access?featureNames=${featureName}`;
  const request = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  const response = await request.json();
  const { features } = response;
  const [firstFeature] = features;
  const { myfeatureName, access } = firstFeature;
  return String(access);
}

export async function fetchUserAmpStatusOfEnableMeshTextureApi(): Promise<string> {
  const status = await fetchUserAmpStatus('CanEnableMeshTextureApi');
  return String(status);
}
