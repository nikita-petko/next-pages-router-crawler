import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { AddIcon, Button, Grid, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import MatchmakingPlayerAttributeTable from '../components/TableComponents/MatchmakingPlayerAttributeTable';
import MatchmakingServerAttributeTable from '../components/TableComponents/MatchmakingServerAttributeTable';
import type { PlayerAttributesBriefInfo, ServerAttributesInfo } from '../types/AttributesInfo';
import useMatchmakingContainerStyles from './MatchmakingContainer.styles';

export interface MatchmakingAttributesContainerProps {
  isLoadingAttributes: boolean;
  currentPlayerAttributes?: PlayerAttributesBriefInfo[];
  currentServerAttributes?: ServerAttributesInfo[];
}

const MatchmakingAttributesContainer: FunctionComponent<
  React.PropsWithChildren<MatchmakingAttributesContainerProps>
> = ({ isLoadingAttributes, currentPlayerAttributes, currentServerAttributes }) => {
  const {
    classes: { container },
  } = useMatchmakingContainerStyles();
  const { translate } = useTranslation();
  const router = useRouter();

  const universeId = router.query.id as string;

  const createAttributeLink = useMemo(() => {
    return dashboard.getCustomMatchmakingAttributeCreationUrl(Number(universeId));
  }, [universeId]);

  const handleCreateAttributeButtonClick = useCallback(() => {
    router.push(createAttributeLink);
  }, [router, createAttributeLink]);

  const handleEditPlayerAttributeButtonClick = useCallback(
    (attributeId: string) => {
      router.push(
        dashboard.getCustomMatchmakingEditPlayerAttributeUrl(Number(universeId), attributeId),
      );
    },
    [router, universeId],
  );

  const handleEditServerAttributeButtonClick = useCallback(
    (attributeId: string) => {
      router.push(
        dashboard.getCustomMatchmakingEditServerAttributeUrl(Number(universeId), attributeId),
      );
    },
    [router, universeId],
  );

  const createAttributeButton = useCallback(
    (isEmptyContainer: boolean, isDisabled: boolean) => (
      <Button
        data-testid='create-attribute-button'
        disabled={isDisabled}
        variant='contained'
        size={isEmptyContainer ? 'large' : 'medium'}
        color='primaryBrand'
        aria-label={translate('Button.CreateAttribute')}
        onClick={() => handleCreateAttributeButtonClick()}>
        <Grid item display='flex' direction='row' alignItems='center'>
          <AddIcon />
          <Typography variant='buttonMedium' style={{ marginTop: 3, marginLeft: 3 }}>
            {' '}
            {translate('Button.CreateAttribute')}
          </Typography>
        </Grid>
      </Button>
    ),
    [handleCreateAttributeButtonClick, translate],
  );

  const shouldEnableCreateButton = !!(
    currentPlayerAttributes &&
    currentPlayerAttributes?.length <= 5 &&
    currentServerAttributes &&
    currentServerAttributes?.length <= 5
  );

  if (
    !isLoadingAttributes &&
    ((currentPlayerAttributes && currentPlayerAttributes?.length > 0) ||
      (currentServerAttributes && currentServerAttributes?.length > 0))
  ) {
    return (
      <Grid>
        <Grid className={container}>{createAttributeButton(false, !shouldEnableCreateButton)}</Grid>
        <Grid className={container}>
          <MatchmakingPlayerAttributeTable
            playerAttributes={currentPlayerAttributes}
            onEdit={handleEditPlayerAttributeButtonClick}
          />
        </Grid>
        <Grid className={container}>
          <MatchmakingServerAttributeTable
            serverAttributes={currentServerAttributes}
            onEdit={handleEditServerAttributeButtonClick}
          />
        </Grid>
      </Grid>
    );
  }
  if (
    !isLoadingAttributes &&
    currentPlayerAttributes?.length === 0 &&
    currentServerAttributes?.length === 0
  ) {
    return (
      <EmptyState
        title={translate('Title.NoAttributes')}
        description={<Typography>{translate('Description.Attributes')}</Typography>}
        size='large'
        illustration='configurations'>
        {createAttributeButton(true, false)}
      </EmptyState>
    );
  }
  return <PageLoading />;
};

export default MatchmakingAttributesContainer;
