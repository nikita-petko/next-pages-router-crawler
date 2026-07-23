import React, { Fragment } from 'react';
import { CircularProgress, Divider } from '@rbx/ui';
import { TModalStageComponentProps } from '../transferConfiguration';
import OwnershipTransferEligibilityItem from './OwnershipTransferEligibilityItem';
import { ownershipTransferEligibilityContent } from '../constants/contentConstants';
import { TSupportedEligibilityChecks } from '../types';
import useGetFailingEligibilityChecks from '../hooks/useGetFailingEligibilityChecks';

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
          currentResourceEligibilityChecks[
            key as TSupportedEligibilityChecks<typeof resource.resourceType>
          ];

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
