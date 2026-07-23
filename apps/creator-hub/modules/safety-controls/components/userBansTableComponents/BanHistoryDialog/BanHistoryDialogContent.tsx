import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  CloseIcon,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@rbx/ui';
import openCloudSafetyClient from '@modules/clients/openCloudSafety';
import Flex from '@modules/miscellaneous/components/Flex';
import { EM_DASH } from '../../../constants/userBansConstants';
import type { UserRestrictionLog } from '../../../utils/userBansDataUtils';
import { getUserIdFromUserPath, getUsernameFromUserId } from '../../../utils/userBansDataUtils';
import BanEvent from './BanEvent';
import UseBanHistoryDialogContentStyles from './BanHistoryDialogContent.styles';

type BanHistoryDialogContentProps = {
  universeId: number;
  userId: number;
  onClose: () => void;
};

const BanHistoryDialogContent = ({ universeId, userId, onClose }: BanHistoryDialogContentProps) => {
  const {
    classes: { dialogContentContainer, endIndicator },
  } = UseBanHistoryDialogContentStyles();
  const { translate } = useTranslation();

  const [userRestrictionLogData, setUserRestrictionLogData] = useState<UserRestrictionLog[]>([]);
  const [userIdUsernameMap, setUserIdUsernameMap] = useState<Map<number, string>>(
    new Map<number, string>(),
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [noMoreData, setNoMoreData] = useState<boolean>(false);
  const nextPageTokenRef = useRef<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomOfDialogRef = useRef<HTMLDivElement | null>(null);

  const fetchUserRestrictionLogsDataRef = useRef<() => Promise<void>>(undefined);
  fetchUserRestrictionLogsDataRef.current = async () => {
    if (loading || noMoreData) {
      return;
    }

    try {
      setLoading(true);
      const [logs, , response] = await openCloudSafetyClient.listUserRestrictionLogsSync({
        parent: openCloudSafetyClient.universePath(universeId.toString()),
        filter: `place == '' && user == 'users/${userId}'`,
        pageToken: nextPageTokenRef.current,
      });

      const userIdUsernamePairs = await Promise.all(
        logs
          .filter((userRestrictionLog) => userRestrictionLog.moderator?.robloxUser != null)
          .map(async (userRestrictionLog): Promise<[number, string]> => {
            const logUserId = getUserIdFromUserPath(userRestrictionLog.moderator!.robloxUser!);
            const username = await getUsernameFromUserId(logUserId);
            return [logUserId, username];
          }),
      );
      const userIdToUsername = new Map<number, string>(userIdUsernamePairs);

      const pageToken = response.nextPageToken ?? '';
      nextPageTokenRef.current = pageToken;

      setNoMoreData(pageToken === '');
      setUserRestrictionLogData((prevData) => [...prevData, ...logs]);
      setUserIdUsernameMap(userIdToUsername);
    } finally {
      setLoading(false);
    }
  };

  const getModeratorName = (userRestrictionLog: UserRestrictionLog): string => {
    if (userRestrictionLog.moderator?.robloxUser != null) {
      return `@${userIdUsernameMap.get(getUserIdFromUserPath(userRestrictionLog.moderator.robloxUser)) ?? EM_DASH}`;
    }
    if (userRestrictionLog.moderator?.gameServerScript) {
      return translate('Label.GameScript');
    }
    return translate('Label.Roblox');
  };

  // Set up IntersectionObserver when Dialog opens at start, which fetches more data when we are at the bottom of scroll
  useEffect(() => {
    const bottomOfDialog = bottomOfDialogRef.current;
    if (!bottomOfDialog) {
      throw new Error('Could not find bottomOfDialog element in BanHistoryDialogContent');
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && fetchUserRestrictionLogsDataRef.current) {
        fetchUserRestrictionLogsDataRef.current();
      }
    });
    const observer = observerRef.current;
    observer.observe(bottomOfDialog);

    return () => {
      observer.unobserve(bottomOfDialog);
    };
  }, []);

  let bottomOfDialogContent: React.ReactNode = null;
  if (loading) {
    // Loading state at bottom of ban history dialog
    bottomOfDialogContent = (
      <Flex justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Flex>
    );
  } else if (userRestrictionLogData.length === 0) {
    // No ban history to show at all state
    bottomOfDialogContent = (
      <Flex justifyContent='center'>
        <Typography component='h6' variant='h6'>
          {translate('Label.NoBanHistory')}
        </Typography>
      </Flex>
    );
  } else if (noMoreData) {
    // End of ban history state
    bottomOfDialogContent = (
      <Typography classes={{ root: endIndicator }} color='secondary'>
        {translate('Label.EndOfUserBanHistory')}
      </Typography>
    );
  }

  return (
    <>
      <DialogTitle>
        <div>{translate('Heading.BanHistory', { userId: userId.toString() })}</div>
        <Typography color='secondary' variant='body2'>
          {translate('Description.BanHistory')}
        </Typography>
      </DialogTitle>
      <IconButton
        aria-label='close'
        color='default'
        onClick={onClose}
        size='large'
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}>
        <CloseIcon />
      </IconButton>
      <DialogContent classes={{ root: dialogContentContainer }}>
        {userRestrictionLogData.map((userRestrictionLog, index) => (
          <BanEvent
            // eslint-disable-next-line react/no-array-index-key -- nothing else to use
            key={index}
            isFirstBanEvent={index === 0}
            userRestrictionLog={userRestrictionLog}
            moderatorName={getModeratorName(userRestrictionLog)}
          />
        ))}
        {bottomOfDialogContent}
        <div ref={bottomOfDialogRef} />
      </DialogContent>
    </>
  );
};

export default BanHistoryDialogContent;
