import { Fragment } from 'react';
import { CircularProgress, Divider } from '@rbx/ui';
import { ownershipTransferEligibilityContent } from '../constants/contentConstants';
import useGetFailingEligibilityChecks from '../hooks/useGetFailingEligibilityChecks';
import type { TModalStageComponentProps, TSupportedEligibilityChecks } from '../types';
import OwnershipTransferEligibilityItem from './OwnershipTransferEligibilityItem';

const OwnershipTransferEligibilityStage = ({ resource }: TModalStageComponentProps) => {
  const { checksWithStatus, isLoading } = useGetFailingEligibilityChecks({ resource });

  if (isLoading) {
    return <CircularProgress />;
  }

  const currentResourceEligibilityChecks =
    ownershipTransferEligibilityContent[resource.resourceType];

  return (
    <div>
      {checksWithStatus.map(({ key, isPassing }, i) => {
        if (!(key in currentResourceEligibilityChecks)) {
          return null;
        }

        const { title, description, actionText, actionLink } =
          currentResourceEligibilityChecks[key];

        return (
          <Fragment key={key}>
            <OwnershipTransferEligibilityItem
              title={title}
              isPassing={isPassing}
              description={description}
              actionText={actionText}
              actionLink={actionLink !== undefined ? actionLink(resource) : undefined}
            />
            {i !== checksWithStatus.length - 1 && <Divider />}
          </Fragment>
        );
      })}
    </div>
  );
};

export default OwnershipTransferEligibilityStage;
