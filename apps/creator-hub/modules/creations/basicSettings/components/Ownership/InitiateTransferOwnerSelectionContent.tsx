import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import {
  ResourceType,
  CreatorType as TransferCreatorType,
} from '@rbx/client-ownership-transfer-api/v1';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ReturnPolicy } from '@rbx/thumbnails';
import {
  InputAdornment,
  SearchIcon,
  Grid,
  TextField,
  MenuItem,
  Select,
  Typography,
  Avatar,
  makeStyles,
  Tooltip,
  Chip,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { TGroup } from '@modules/authentication/types';
import ownershipTransferClient from '@modules/clients/ownershipTransferApi';
import { CreatorType, Item, itemTypeToThumbnailType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useGroups } from '@modules/providers/groups/GroupsProvider';

export type InitiateTransferOwnerSelectionContentProps = {
  targetGroupId?: number;
  setTargetGroupId: React.Dispatch<React.SetStateAction<number | undefined>>;
  nameVerificationText: string;
  setNameVerificationText: React.Dispatch<React.SetStateAction<string>>;
};

const useStyles = makeStyles()(() => ({
  select: {
    marginBottom: 24,
  },
  heading: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 24,
  },
  groupDetail: {
    marginBottom: 24,
  },
}));

const InitiateTransferOwnerSelectionContent: FunctionComponent<
  React.PropsWithChildren<InitiateTransferOwnerSelectionContentProps>
> = ({ targetGroupId, setTargetGroupId, nameVerificationText, setNameVerificationText }) => {
  const { translate } = useTranslation();

  const { user } = useAuthentication();
  const { groups } = useGroups();
  const { gameDetails, canConfigure } = useCurrentGame();

  const {
    classes: { select, heading, description, groupDetail },
  } = useStyles();

  // groups from useGroups = user's available groups in creator hub
  // eligibleGroups = user's groups with publish permission
  // invalidGroups = universe's invalid targets from previous denial, cancel, timeouts
  const [eligibleGroups, setEligibleGroups] = useState<TGroup[]>([]);
  const [invalidGroups, setInvalidGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    const getGroups = async () => {
      if (user && groups) {
        const permissibleGroups = await ownershipTransferClient.getPermissibleGroups();
        const eligibleIdSet = new Set(permissibleGroups);

        // Filter out the current universe owner group if it's a group
        // to prevent transferring to the same creator
        const currentOwnerGroupId =
          gameDetails?.creator?.type === TransferCreatorType.Group
            ? gameDetails?.creator?.id
            : undefined;

        setEligibleGroups(
          groups?.filter((gr) => eligibleIdSet.has(gr.id) && gr.id !== currentOwnerGroupId),
        );
      }
    };
    getGroups();
  }, [user, groups, gameDetails?.creator?.type, gameDetails?.creator?.id]);

  useEffect(() => {
    const getInvalidGroups = async () => {
      if (gameDetails?.id) {
        const invalidTargetsResponse = await ownershipTransferClient.listInvalidTargets({
          resourceType: ResourceType.Universe,
          resourceId: gameDetails.id,
        });
        const { invalidTargets } = invalidTargetsResponse;
        // Assumes creator type is group as universe is currently user => group
        const invalidGroupSet = new Set(invalidTargets.map((target) => target.creatorId));
        setInvalidGroups(invalidGroupSet);
      }
    };
    getInvalidGroups();
  }, [user, groups, gameDetails]);

  return (
    <Grid container>
      <Grid container>
        <Grid item XSmall>
          <Grid container>
            <Grid item XSmall={12} className={heading}>
              <Typography variant='h6'>{translate('Heading.NewOwner')}</Typography>
            </Grid>
            <Grid item XSmall={12} className={description}>
              <Typography variant='captionBody' color='secondary'>
                {translate('Description.NewOwner')}
              </Typography>
            </Grid>
          </Grid>
          <Select
            fullWidth
            size='small'
            label={translate('Action.SelectGroup')}
            value={targetGroupId}
            onChange={(e) => {
              setTargetGroupId(Number(e.target.value));
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='end'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            className={select}>
            {eligibleGroups.map((group) => {
              if (invalidGroups.has(group.id)) {
                return (
                  <Tooltip
                    title={translate('Description.RequestedRecently')}
                    arrow
                    key={group.id}
                    placement='right'>
                    <Grid container>
                      <Grid item XSmall>
                        <MenuItem key={group.id} value={group.id} disabled>
                          <ThumbnailWithNames
                            target={group}
                            targetType={CreatorType.Group}
                            disableLink
                            disabled
                            variant='compact'
                          />
                        </MenuItem>
                      </Grid>
                      <Grid item style={{ paddingRight: 10 }}>
                        <Grid container alignContent='center' style={{ height: '100%' }}>
                          <Chip color='secondary' label={translate('Label.RequestedRecently')} />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Tooltip>
                );
              }
              return (
                <MenuItem key={group.id} value={group.id}>
                  <ThumbnailWithNames
                    target={group}
                    targetType={CreatorType.Group}
                    disableLink
                    variant='compact'
                  />
                </MenuItem>
              );
            })}
            {eligibleGroups.length === 0 && (
              <MenuItem disabled>{translate('Label.NoEligibleGroups')}</MenuItem>
            )}
          </Select>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item XSmall>
          <Grid container>
            <Grid item XSmall={12} className={heading}>
              <Typography variant='h6'>{translate('Heading.Verification')}</Typography>
            </Grid>
            <Grid item XSmall={12} className={description}>
              <Typography variant='captionBody' color='secondary'>
                {translate('Description.Verification')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container alignItems='center' className={groupDetail}>
            <Avatar variant='rounded' alt='icon'>
              <Thumbnail2d
                targetId={gameDetails?.id ?? 0}
                type={itemTypeToThumbnailType[Item.Game]}
                alt={gameDetails?.name ?? ''}
                returnPolicy={canConfigure ? ReturnPolicy.AutoGenerated : ReturnPolicy.PlaceHolder}
              />
            </Avatar>
            <Typography style={{ paddingLeft: 8 }}>{gameDetails?.name}</Typography>
          </Grid>
          <TextField
            size='small'
            fullWidth
            id='verification-input'
            label={translate('Action.ExperienceName')}
            value={nameVerificationText}
            onChange={(e) => setNameVerificationText(e.target.value)}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default InitiateTransferOwnerSelectionContent;
