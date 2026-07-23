import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

// (@dbrunais 08/22/2025) @rbx/clients types are incorrect. Due to time constraint manually using fetch
const basePath = getBEDEV2ServiceBasePath('creator-home-api');
const getUnratedExperienceBanner = async ({ id, group }: { id: number; group: boolean }) => {
  const type = group ? 'groups' : 'users';
  const url = `${basePath}/v1/${type}/${id}/homepage/banner/experience-unrated`;
  const data = await fetch(url, { credentials: 'include' });
  const json = await data.json();
  return json as { universeIds: number[] | null };
};

export default getUnratedExperienceBanner;
