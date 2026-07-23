import React, { useCallback, useMemo, useState, Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  ProgressCircle,
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
  Button,
} from '@rbx/foundation-ui';
import {
  GroupFeatureResponseItem,
  SetGroupFeaturesRequestFeatures,
  GroupFeatureTypeEnum,
  SetGroupFeaturesEnum,
} from '@modules/clients';
import {
  useGetGroupFeatures,
  useSetGroupFeatures,
} from '@modules/react-query/groupFeatures/groupFeaturesQueries';
import useBottomToast from '../../hooks/useBottomToast';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import BlockedFeaturesTableRow from './BlockedFeaturesTableRow';

const BlockedFeaturesTable = () => {
  const { translate, translateHTML } = useTranslation();
  const { organization } = useCurrentOrganization();
  const [pendingFeature, setPendingFeature] = useState<GroupFeatureResponseItem | null>(null);
  const { showBottomToast } = useBottomToast();

  const { data: groupFeatures, isFetching: isFeaturesFetching } = useGetGroupFeatures(
    organization?.groupId,
  );
  const { mutate: setGroupFeatures, isPending: isSetGroupFeaturesPending } = useSetGroupFeatures();

  const isGroupLocked = useMemo(() => {
    return groupFeatures?.isLocked;
  }, [groupFeatures]);

  const handleConfirmUnblock = useCallback(async () => {
    if (!pendingFeature?.feature || !organization?.groupId) return;

    const features: SetGroupFeaturesRequestFeatures = {
      payouts:
        pendingFeature?.feature === GroupFeatureTypeEnum.Payouts
          ? SetGroupFeaturesEnum.On
          : undefined,
      contentUpload:
        pendingFeature?.feature === GroupFeatureTypeEnum.ContentUpload
          ? SetGroupFeaturesEnum.On
          : undefined,
      groupOwnershipTransfer:
        pendingFeature?.feature === GroupFeatureTypeEnum.GroupOwnershipTransfer
          ? SetGroupFeaturesEnum.On
          : undefined,
      gameOwnershipTransfer:
        pendingFeature?.feature === GroupFeatureTypeEnum.GameOwnershipTransfer
          ? SetGroupFeaturesEnum.On
          : undefined,
    };

    setGroupFeatures(
      {
        groupId: organization.groupId,
        features,
      },
      {
        onSuccess: () => {
          showBottomToast(translate('Message.FeatureUnblocked'));
        },
        onError: () => {
          showBottomToast(translate('Error.UnblockingFeature'), { severity: 'error' });
        },
        onSettled: () => {
          setPendingFeature(null);
        },
      },
    );
  }, [pendingFeature, organization, setGroupFeatures, showBottomToast, translate]);

  const handleCancelUnblock = useCallback(() => {
    setPendingFeature(null);
  }, []);

  const featureName = useMemo(() => {
    return translate(`Label.${pendingFeature?.feature ?? ''}`);
  }, [translate, pendingFeature]);

  if (isFeaturesFetching) {
    return (
      <div className='flex justify-center'>
        <ProgressCircle ariaLabel='Progress' />
      </div>
    );
  }

  return (
    <Fragment>
      <div
        className='table radius-medium'
        style={{ width: 'fit-content', border: '1px solid var(--color-stroke-default)' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              <th
                className='padding-x-xlarge padding-y-medium text-align-x-left'
                style={{ width: '50%' }}>
                <span className='text-body-medium content-emphasis'>
                  {translate('Label.Feature')}
                </span>
              </th>
              <th
                className='padding-x-xlarge padding-y-medium text-align-x-left'
                style={{ width: '50%' }}>
                <span className='text-body-medium content-emphasis'>
                  {translate('Label.Status')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groupFeatures?.features?.map((feature: GroupFeatureResponseItem) => (
              <BlockedFeaturesTableRow
                key={feature.feature}
                feature={feature}
                isGroupLocked={isGroupLocked}
                onRequestUnblock={setPendingFeature}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        isModal
        open={pendingFeature !== null}
        size='Medium'
        hasCloseAffordance={false}
        onOpenChange={(open: boolean) => {
          if (!open) handleCancelUnblock();
        }}>
        <DialogContent>
          <DialogBody className='flex flex-col gap-y-xsmall'>
            <DialogTitle className='text-heading-medium margin-none'>
              {translateHTML('Heading.UnblockFeatures', null, { feature: featureName })}
            </DialogTitle>
            <span className='text-body-medium content-default'>
              {translateHTML('Description.UnblockFeature', null, { feature: featureName })}
            </span>
          </DialogBody>
          <DialogFooter className='flex gap-x-small'>
            <Button
              variant='Alert'
              className='fill basis-0'
              onClick={handleConfirmUnblock}
              isLoading={isSetGroupFeaturesPending}>
              {translate('Action.Unblock')}
            </Button>
            <Button variant='Standard' className='fill basis-0' onClick={handleCancelUnblock}>
              {translate('Action.Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default BlockedFeaturesTable;
