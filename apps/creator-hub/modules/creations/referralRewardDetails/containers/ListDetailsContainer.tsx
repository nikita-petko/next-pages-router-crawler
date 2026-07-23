import React, { useEffect } from 'react';
import type { GetAllRewardMetadataEntityResponse } from '@rbx/client-referral-reward-metadata/v1';
import { withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import EmptyState from '../components/EmptyState';
import RewardMetadataTable from '../components/RewardMetadataTable';
import { UpdateRewardProvider } from '../context/updateContext';
import { getAllRewardMetadataClient, updateRewardMetadataClient } from '../utils/client';

const ListDetailsContent: React.FC = () => {
  const { gameDetails } = useCurrentGame();
  const [rewards, setRewards] = React.useState([] as GetAllRewardMetadataEntityResponse[]);
  useEffect(() => {
    if (!gameDetails?.id) {
      return;
    }
    getAllRewardMetadataClient()
      .getAllRewardMetadataGetAllRewardMetadata({ universeId: gameDetails.id })
      .then((response) => {
        setRewards(response.rewards || []);
      })
      .catch((error) => {
        console.error('Failed to get all reward metadata', error);
      });
  }, [gameDetails?.id]);

  const handlePublish = async (
    rewardId: string,
    startTimestamp: string,
    expiryTimestamp: string,
  ) => {
    if (!gameDetails?.id) {
      return;
    }
    try {
      await updateRewardMetadataClient().updateRewardMetadataUpdateRewardMetadata({
        id: rewardId,
        rewardTimeStartTime: startTimestamp,
        rewardTimeEndTime: expiryTimestamp,
        published: true,
      });
    } catch (error) {
      console.error('Failed to publish reward metadata', error);
    }
  };

  const handleUnpublish = async (
    rewardId: string,
    startTimestamp: string,
    expiryTimestamp: string,
  ) => {
    if (!gameDetails?.id) {
      return;
    }
    try {
      await updateRewardMetadataClient().updateRewardMetadataUpdateRewardMetadata({
        id: rewardId,
        rewardTimeStartTime: startTimestamp,
        rewardTimeEndTime: expiryTimestamp,
        published: false,
      });
    } catch (error) {
      console.error('Failed to unpublish reward metadata', error);
    }
  };

  if (rewards.length === 0) {
    return <EmptyState />;
  }

  return (
    <UpdateRewardProvider reward={null}>
      <RewardMetadataTable
        initRewards={rewards}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
      />
    </UpdateRewardProvider>
  );
};

const ListDetailsContainer: React.FC = () => {
  return <ListDetailsContent />;
};

export default withTranslation(ListDetailsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ReferralRewards,
]);
