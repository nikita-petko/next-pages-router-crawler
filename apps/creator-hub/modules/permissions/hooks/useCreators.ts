import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import type { CreatorFilter, CreatorGroupDetails, EntityDetails } from '../utils/types';
import useGetAllCreators from './queries/creators';

export type UseCreatorsResult = {
  creatorData?: CreatorGroupDetails[];
  isPending: boolean;
  isError: boolean;
};

export default function useCreators(
  creatorFilter: CreatorFilter,
  entity: EntityDetails,
): UseCreatorsResult {
  const { organization, permissions } = useCurrentOrganization();
  const {
    data: creatorData,
    isError,
    isPending,
  } = useGetAllCreators(creatorFilter, entity, organization ?? undefined, permissions ?? undefined);

  return {
    creatorData,
    isPending,
    isError,
  };
}
