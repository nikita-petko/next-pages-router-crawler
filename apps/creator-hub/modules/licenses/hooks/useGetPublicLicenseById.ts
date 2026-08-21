import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';

export const getPublicLicenseByIdParamsKey = 'contentLicensingApiClient/getPublicLicenseByIdParams';

interface GetPublicLicenseByIdParams {
  licenseId: string;
}

/**
 * Returns a single public license by ID.
 */
const useGetPublicLicenseById = ({ licenseId }: GetPublicLicenseByIdParams) => {
  return useQuery({
    queryKey: [getPublicLicenseByIdParamsKey, licenseId],
    queryFn: async () => {
      return contentLicensingClient.getPublicLicense(licenseId);
    },
  });
};

export default useGetPublicLicenseById;
