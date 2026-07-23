import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Link, Select, MenuItem } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import AttributeType from '../../enums/AttributeType';
import useAttributesManagement from '../../hooks/useAttributesManagement';
import useShowToastMessage from '../../hooks/useShowToastMessage';
import type {
  PlayerAttributesDetailedInfo,
  ServerAttributesInfo,
} from '../../types/AttributesInfo';
import { getAttributeFailureLabel, getAttributeSuccessLabel } from '../../utils/FormUtils';
import { attributeTypeTranslationKeys } from '../../utils/translationGetter';
import DeleteDialog from '../DeleteDialog';
import useConfigureAttributesFormStyles from './ConfigureAttributesForm.styles';
import PlayerAttributesForm from './PlayerAttributesForm';
import ServerAttributesForm from './ServerAttributesForm';

export type ConfigureAttributesFormProps = {
  isEditingAttribute: boolean;
  attributeType?: AttributeType;
  currentPlayerAttribute?: PlayerAttributesDetailedInfo;
  currentServerAttribute?: ServerAttributesInfo;
};

const ConfigureAttributesForm: FunctionComponent<
  React.PropsWithChildren<ConfigureAttributesFormProps>
> = ({ isEditingAttribute, attributeType, currentPlayerAttribute, currentServerAttribute }) => {
  const {
    classes: { container, title },
  } = useConfigureAttributesFormStyles();
  const router = useRouter();
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const {
    allPlayerBriefAttributes,
    handleDeletePlayerAttribute,
    handleAddPlayerAttribute,
    handleUpdatePlayerAttribute,
    handleDeleteServerAttribute,
    handleAddServerAttribute,
    handleUpdateServerAttribute,
  } = useAttributesManagement();

  const [selectedAttributeType, setSelectedAttributeType] = useState<AttributeType | null>(
    attributeType ?? null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const attributeName = useMemo(() => {
    if (isEditingAttribute) {
      if (currentPlayerAttribute !== undefined) {
        return currentPlayerAttribute.name;
      }
      return currentServerAttribute?.name;
    }
    return '';
  }, [currentPlayerAttribute, currentServerAttribute?.name, isEditingAttribute]);

  const handleFormCancel = useCallback(() => {
    router.push(dashboard.getCustomMatchmakingAttributesDashboardUrl(Number(gameDetails?.id)));
  }, [gameDetails?.id, router]);

  const handlePlayerFormSave = useCallback(
    async (attribute: PlayerAttributesDetailedInfo) => {
      setIsDialogOpen(false);
      let success: boolean;
      if (isEditingAttribute) {
        success = await handleUpdatePlayerAttribute(attribute);
      } else {
        success = await handleAddPlayerAttribute(attribute);
      }
      if (success) {
        router.push(dashboard.getCustomMatchmakingAttributesDashboardUrl(Number(gameDetails?.id)));
        showSuccessToast(getAttributeSuccessLabel(false, !!isEditingAttribute), translate);
      } else {
        showFailureToast(getAttributeFailureLabel(false, !!isEditingAttribute), translate);
      }
    },
    [
      gameDetails?.id,
      handleAddPlayerAttribute,
      handleUpdatePlayerAttribute,
      isEditingAttribute,
      router,
      showFailureToast,
      showSuccessToast,
      translate,
    ],
  );

  const handleServerFormSave = useCallback(
    async (attribute: ServerAttributesInfo) => {
      setIsDialogOpen(false);
      let success: boolean;
      if (isEditingAttribute) {
        success = await handleUpdateServerAttribute(attribute);
      } else {
        success = await handleAddServerAttribute(attribute);
      }
      router.push(dashboard.getCustomMatchmakingAttributesDashboardUrl(Number(gameDetails?.id)));
      if (success) {
        showSuccessToast(getAttributeSuccessLabel(false, !!isEditingAttribute), translate);
      } else {
        showFailureToast(getAttributeFailureLabel(false, !!isEditingAttribute), translate);
      }
    },
    [
      gameDetails?.id,
      handleAddServerAttribute,
      handleUpdateServerAttribute,
      isEditingAttribute,
      router,
      showFailureToast,
      showSuccessToast,
      translate,
    ],
  );

  const handleFormDelete = useCallback(async () => {
    let success: boolean;
    if (selectedAttributeType === AttributeType.Player) {
      success = await handleDeletePlayerAttribute(currentPlayerAttribute?.id);
    } else {
      success = await handleDeleteServerAttribute(currentServerAttribute?.id);
    }
    router.push(dashboard.getCustomMatchmakingAttributesDashboardUrl(Number(gameDetails?.id)));
    if (success) {
      showSuccessToast(getAttributeSuccessLabel(true, !!isEditingAttribute), translate);
    } else {
      showFailureToast(getAttributeFailureLabel(true, !!isEditingAttribute), translate);
    }
  }, [
    currentPlayerAttribute?.id,
    currentServerAttribute?.id,
    gameDetails?.id,
    handleDeletePlayerAttribute,
    handleDeleteServerAttribute,
    isEditingAttribute,
    router,
    selectedAttributeType,
    showFailureToast,
    showSuccessToast,
    translate,
  ]);

  const handleAttributeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = AttributeType[event.target.value as keyof typeof AttributeType];
    setSelectedAttributeType(selectedType);
  };

  const attributeDescription = translateHTML('Description.Attribute', [
    {
      opening: 'startLink',
      closing: 'endLink',
      content(chunks) {
        return (
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/matchmaking/attributes-and-signals#custom-attributes`}
            target='_blank'
            underline='always'>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  const attributeHeading = useMemo(() => {
    if (isEditingAttribute && selectedAttributeType !== null) {
      return selectedAttributeType === AttributeType.Player
        ? 'Label.EditPlayerAttribute'
        : 'Label.EditServerAttribute';
    }
    return 'Heading.CreateAttribute';
  }, [isEditingAttribute, selectedAttributeType]);

  return (
    <Grid container direction='column'>
      <HubMeta hubOnly title={buildTitle(translate(attributeHeading))} />
      <Grid container direction='column' className={title}>
        <Typography variant='h1'>{translate(attributeHeading)}</Typography>
        <Typography variant='body1'>{attributeDescription}</Typography>
      </Grid>

      <Grid>
        <Grid className={container}>
          <Select
            label={translate('Label.AttributeType')}
            id='attributeType'
            fullWidth
            required
            disabled={!!isEditingAttribute}
            value={selectedAttributeType}
            InputLabelProps={{
              shrink: !!selectedAttributeType,
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleAttributeTypeChange(e);
            }}>
            {Object.values(AttributeType).map((attrType) => (
              <MenuItem key={attrType} value={attrType}>
                {translate(attributeTypeTranslationKeys[attrType])}
              </MenuItem>
            ))}
          </Select>
          {selectedAttributeType === AttributeType.Player && (
            <PlayerAttributesForm
              currentAttribute={currentPlayerAttribute}
              onSave={handlePlayerFormSave}
              onCancel={handleFormCancel}
              onDelete={() => setIsDialogOpen(true)}
              isEditingAttribute={!!isEditingAttribute}
            />
          )}
          {selectedAttributeType === AttributeType.Server && (
            <ServerAttributesForm
              currentAttribute={currentServerAttribute}
              existingPlayerAttributes={allPlayerBriefAttributes}
              onSave={handleServerFormSave}
              onCancel={handleFormCancel}
              onDelete={() => setIsDialogOpen(true)}
              isEditingAttribute={!!isEditingAttribute}
            />
          )}
        </Grid>
      </Grid>
      <DeleteDialog
        isDialogOpen={isDialogOpen}
        name={attributeName ?? ''}
        onClose={() => setIsDialogOpen(false)}
        onDeleteSuccess={handleFormDelete}
      />
    </Grid>
  );
};

export default ConfigureAttributesForm;
