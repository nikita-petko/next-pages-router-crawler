import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ImageIcon,
  Label,
  CircularProgress,
  Grid,
  Typography,
  EditIcon,
  IconButton,
} from '@rbx/ui';
import { assetdeliveryClient } from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { GetAllRewardMetadataEntityResponse } from '@rbx/clients/referralRewardMetadata/v1';
import { useRouter } from 'next/router';
import { Link } from '@modules/miscellaneous/common';
import { resolveUrl } from '@rbx/env-utils';
import { getAllRewardMetadataClient } from '../utils/client';
import { useUpdateRewardContext } from '../context/updateContext';
import ReferralRewardSubmissionForm from './ReferralRewardSubmissionForm';
import { StudioReminder } from './EmptyState';
import DefaultPublishRewardModal from './PublishActionModals';

interface RewardMetadataTableProps {
  initRewards: GetAllRewardMetadataEntityResponse[];
  onPublish: (rewardId: string, startTimestamp: string, expiryTimestamp: string) => void;
  onUnpublish: (rewardId: string, startTimestamp: string, expiryTimestamp: string) => void;
}
const IMAGE_SIZE = 40;
const MARGIN_SMALL = 8;
const NAME_WIDTH = 200;
const TERMS_AND_CONDITIONS_URL = resolveUrl(
  'friendRewardsTermsOfUseUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);

const RewardMetadataTable: React.FC<RewardMetadataTableProps> = ({
  initRewards,
  onPublish,
  onUnpublish,
}) => {
  const { translate } = useTranslation();
  const [iconUrls, setIconUrls] = useState<Record<string, string>>({});
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [rewards, setRewards] = useState<GetAllRewardMetadataEntityResponse[]>(initRewards);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { gameDetails } = useCurrentGame();
  const { setUpdateReward, updateReward } = useUpdateRewardContext();
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);
  const [publishModalContent, setPublishModalContent] = React.useState<{
    type: 'publish' | 'unpublish';
    title: string;
    description: string;
    confirmButtonText: string;
  }>({
    type: 'publish',
    title: '',
    description: '',
    confirmButtonText: '',
  });
  const [onPublishReward, setOnPublishReward] = React.useState<() => void>(() => {});

  const router = useRouter();

  const loadIcons = useCallback(
    async (currentRewards: GetAllRewardMetadataEntityResponse[]) => {
      const iconAssetIds =
        currentRewards.length > 0 &&
        currentRewards
          .filter((reward) => reward.iconAssetId)
          .map((reward) => Number(reward.iconAssetId));

      if (iconAssetIds && iconAssetIds.length > 0) {
        try {
          const response = await assetdeliveryClient.getAssets(
            iconAssetIds.map((id) => ({ assetId: id, requestId: String(id) })),
          );
          const urls = response.reduce(
            (acc, item) => {
              if (item.requestId && item.location) {
                acc[item.requestId] = item.location;
              }
              return acc;
            },
            {} as Record<string, string>,
          );
          setIconUrls(urls);
        } catch (err) {
          // eslint-disable-next-line no-console -- NOTE(npatel, 3/31/25): Handle error gracefully
          console.error('Failed to load icons', err);
        }
      }
    },
    [setIconUrls],
  );

  useEffect(() => {
    if (initRewards) {
      loadIcons(initRewards);
    }
  }, [loadIcons, initRewards]);

  const setAllRewards = useCallback(async () => {
    setIsLoading(true);
    if (!gameDetails?.id) return;
    getAllRewardMetadataClient()
      .getAllRewardMetadataGetAllRewardMetadata({ universeId: gameDetails?.id })
      .then((response) => {
        setRewards(response.rewards as GetAllRewardMetadataEntityResponse[]);
        loadIcons(response.rewards as GetAllRewardMetadataEntityResponse[]);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [gameDetails?.id, loadIcons, setIsLoading]);

  const handlePublish = useCallback(
    async (rewardId: string, startTimestamp: string, expiryTimestamp: string) => {
      try {
        await onPublish(rewardId, startTimestamp, expiryTimestamp);
        setAllRewards();
      } catch (err) {
        // eslint-disable-next-line no-console -- NOTE(npatel, 3/31/25): Handle error gracefully
        console.error('Failed to publish reward metadata', err);
      }
    },
    [onPublish, setAllRewards],
  );

  const handleUnpublish = useCallback(
    async (rewardId: string, startTimestamp: string, expiryTimestamp: string) => {
      try {
        await onUnpublish(rewardId, startTimestamp, expiryTimestamp);
        setAllRewards();
      } catch (err) {
        // eslint-disable-next-line no-console -- NOTE(npatel, 3/31/25): Handle error gracefully
        console.error('Failed to unpublish reward metadata', err);
      }
    },
    [onUnpublish, setAllRewards],
  );

  const onPublishButtonClick = useCallback(
    (reward: GetAllRewardMetadataEntityResponse, unpublish: boolean) => {
      if (!unpublish) {
        setPublishModalContent({
          type: 'publish',
          title: translate('ReferralRewards.PublishModalTitle'),
          description: translate('ReferralRewards.PublishRewardDefaultDescription'),
          confirmButtonText: translate('ReferralRewards.PublishRewardButton'),
        });
        setOnPublishReward(() => () => {
          handlePublish(
            reward.id || '',
            reward.rewardTimeOffset?.startUtc?.toISOString() || '',
            reward.rewardTimeOffset?.endUtc?.toISOString() || '',
          );
          setPublishModalOpen(false);
        });
      } else if (
        unpublish &&
        reward.rewardTimeOffset &&
        reward.rewardTimeOffset.endUtc &&
        reward.rewardTimeOffset.endUtc > new Date()
      ) {
        setPublishModalContent({
          type: 'unpublish',
          title: translate('ReferralRewards.CancelReward'),
          description: translate('ReferralRewards.CancelRewardDescription'),
          confirmButtonText: translate('ReferralRewards.CancelReward'),
        });
        setOnPublishReward(() => () => {
          handleUnpublish(
            reward.id || '',
            reward.rewardTimeOffset?.startUtc?.toISOString() || '',
            reward.rewardTimeOffset?.endUtc?.toISOString() || '',
          );
          setPublishModalOpen(false);
        });
      } else {
        handleUnpublish(
          reward.id || '',
          reward.rewardTimeOffset?.startUtc?.toISOString() || '',
          reward.rewardTimeOffset?.endUtc?.toISOString() || '',
        );
        return;
      }
      setPublishModalOpen(true);
    },
    [
      handlePublish,
      handleUnpublish,
      setPublishModalOpen,
      setOnPublishReward,
      setPublishModalContent,
      translate,
    ],
  );

  const getStatusLabel = (reward: GetAllRewardMetadataEntityResponse) => {
    if (
      reward.rewardTimeOffset?.endUtc &&
      new Date() > reward.rewardTimeOffset.endUtc &&
      !reward.published
    ) {
      return translate('ReferralRewards.StatusExpired');
    }
    return reward.published
      ? translate('ReferralRewards.StatusPublished')
      : translate('ReferralRewards.StatusSaved');
  };

  const getStatusSeverity = (reward: GetAllRewardMetadataEntityResponse) => {
    if (
      reward.rewardTimeOffset?.endUtc &&
      new Date() > reward.rewardTimeOffset.endUtc &&
      !reward.published
    ) {
      return 'error';
    }
    return reward.published ? 'success' : 'default';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'error.main' }}>
        {translate('Error.FailedToLoadRewards')}
      </div>
    );
  }

  if (updateReward !== null && updateReward !== undefined) {
    return (
      <ReferralRewardSubmissionForm
        updateRewardProps={updateReward}
        onSuccess={() => {
          setUpdateReward(null);
          setAllRewards();
        }}
        onUpdateCancel={() => {
          setUpdateReward(null);
          setAllRewards();
        }}
      />
    );
  }

  return (
    <React.Fragment>
      <DefaultPublishRewardModal
        open={publishModalOpen}
        onClose={() => {
          setPublishModalOpen(false);
        }}
        color={publishModalContent.type === 'publish' ? 'primaryBrand' : 'destructive'}
        dialogTitle={publishModalContent.title}
        dialogDescription={
          <React.Fragment>
            <Typography variant='body1'>{`${publishModalContent.description} `}</Typography>
            {publishModalContent.type === 'publish' && (
              <Link href={TERMS_AND_CONDITIONS_URL} target='_blank' rel='noopener noreferrer'>
                {translate('ReferralRewards.ReferralProgramTermsLabel')}
              </Link>
            )}
          </React.Fragment>
        }
        confirmButtonText={publishModalContent.confirmButtonText}
        cancelButtonText={translate('Action.Cancel')}
        onConfirm={onPublishReward}
        onCancel={() => {
          setPublishModalOpen(false);
        }}
      />
      <Grid container direction='column' gap={2}>
        <Grid container item direction='column' alignItems='flex-start'>
          <Grid item>
            <h1 style={{ marginBottom: 0, padding: 0 }}>{translate('ReferralRewards.Title')}</h1>
          </Grid>
          <Grid item>
            <p>
              <Typography variant='body1'>
                {translate('ReferralRewards.EncourageDescription')}
              </Typography>
            </p>
          </Grid>
          <Grid item>
            <Button
              color='primaryBrand'
              variant='contained'
              onClick={() =>
                router.push(
                  `/dashboard/creations/experiences/${gameDetails?.id}/referral-reward-details/create`,
                )
              }>
              {translate('ReferralRewards.AddRewardDetails')}
            </Button>
          </Grid>
          <StudioReminder />
        </Grid>
        <Grid item>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={NAME_WIDTH}>{translate('Label.Name')}</TableCell>
                  <TableCell>{translate('ReferralRewards.ExpireTime')}</TableCell>
                  <TableCell>{translate('ReferralRewards.Status')}</TableCell>
                  <TableCell align='right'>{translate('Label.Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rewards &&
                  rewards.length > 0 &&
                  rewards?.map((reward) => (
                    <TableRow
                      key={reward.id}
                      onMouseEnter={() => setHoveredRow(reward.id || null)}
                      onMouseLeave={() => setHoveredRow(null)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}>
                      <TableCell style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {reward.iconAssetId && iconUrls[reward.iconAssetId] ? (
                          <img
                            src={iconUrls[reward.iconAssetId]}
                            alt={reward.name || ''}
                            style={{
                              width: IMAGE_SIZE,
                              height: IMAGE_SIZE,
                              objectFit: 'contain',
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <Typography
                            variant='body1'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: IMAGE_SIZE,
                              height: IMAGE_SIZE,
                            }}>
                            <ImageIcon />
                          </Typography>
                        )}
                        <Typography variant='body1'>{reward.name}</Typography>
                      </TableCell>
                      <TableCell>
                        {reward.rewardTimeOffset?.endUtc
                          ? `${reward.rewardTimeOffset.endUtc.toDateString()} ${reward.rewardTimeOffset.endUtc.toLocaleTimeString()}`
                          : ''}
                      </TableCell>
                      <TableCell>
                        <Label
                          labelText={getStatusLabel(reward)}
                          severity={getStatusSeverity(reward)}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <div
                          style={{
                            visibility: hoveredRow === reward.id ? 'visible' : 'hidden',
                          }}>
                          <Button
                            onClick={() =>
                              reward.published
                                ? onPublishButtonClick(reward, true)
                                : onPublishButtonClick(reward, false)
                            }
                            color='secondary'
                            variant='contained'
                            size='small'
                            style={{
                              marginRight: MARGIN_SMALL,
                              whiteSpace: 'nowrap',
                            }}>
                            {reward.published
                              ? translate('ReferralRewards.CancelReward')
                              : translate('ReferralRewards.PublishButton')}
                          </Button>
                          <IconButton
                            aria-label='Edit'
                            color='secondary'
                            onClick={() =>
                              setUpdateReward({
                                id: reward.id || '',
                                name: reward.name || '',
                                description: reward.description || '',
                                limits: reward.limits || '',
                                from: reward.rewardTimeOffset?.startUtc || new Date(),
                                to: reward.rewardTimeOffset?.endUtc || new Date(),
                                imageUrl: reward.iconAssetId ? iconUrls[reward.iconAssetId] : null,
                              })
                            }>
                            <EditIcon
                              style={{
                                cursor: 'pointer',
                                margin: 0,
                                padding: 0,
                              }}
                            />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default RewardMetadataTable;
