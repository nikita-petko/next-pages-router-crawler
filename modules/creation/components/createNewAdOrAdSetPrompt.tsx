import ClearIcon from '@mui/icons-material/Clear';
import {
  Button,
  DialogContent,
  Link,
  makeStyles,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useEffect, useState } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { ServerAdType } from '@constants/ad';
import { StatusText } from '@constants/campaignStatus';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import { useDisplayStatusesStore } from '@modules/stores/displayStatusStoreProvider';
import { useLimitInfoStore } from '@modules/stores/limitInfoStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { GetBackendCampaignStatusText } from '@utils/displayStatus';
import { TODOFIXANY } from 'app/shared/types';

export enum EntityTypeEnum {
  AD = 'AD',
  ADSET = 'ADSET',
  CAMPAIGN = 'CAMPAIGN',
}

const OrDivider = () => {
  const {
    classes: { centeredLine, container },
  } = makeStyles()(() => ({
    centeredLine: {
      background: '#CBCBCB',
      height: '100%',
      width: 1,
    },

    container: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      height: 55,
    },
  }))();
  return (
    <span className={container}>
      <span className={centeredLine} />
      <span>OR</span>
      <span className={centeredLine} />
    </span>
  );
};

const CreateNewAdOrAdSetPrompt = ({
  format,
  onClose,
  onNewAdButtonClicked,
  onNewAdSetButtonClicked,
  onNewCampaignButtonClicked,
  shouldDisableCampaignCreation,
}: {
  format: EntityTypeEnum;
  onClose: TODOFIXANY;
  onNewAdButtonClicked: TODOFIXANY;
  onNewAdSetButtonClicked: TODOFIXANY;
  onNewCampaignButtonClicked: TODOFIXANY;
  shouldDisableCampaignCreation?: boolean;
}) => {
  const {
    classes: {
      ctaButton,
      dialogInputSelectionRow,
      dialogRow,
      iconButton,
      relativeLeftAligned,
      relativeRightAligned,
      selectorInput,
    },
  } = makeStyles()(() => ({
    ctaButton: {
      marginRight: 7,
    },

    dialogInputSelectionRow: {
      alignItems: 'center',
      columnGap: 30,
      display: 'flex',
      height: 55,
      marginBottom: 14,
      position: 'relative',
      // Max width of the MUI modal is 600px
      width: 550,
    },

    dialogRow: {
      alignItems: 'center',
      display: 'flex',
      height: 55,
      marginBottom: 14,
      position: 'relative',
      // Max width of the MUI modal is 600px
      width: 550,
    },

    iconButton: {
      cursor: 'pointer',
    },

    relativeLeftAligned: {
      left: 0,
      position: 'absolute',
    },

    relativeRightAligned: {
      position: 'absolute',
      right: 0,
    },

    selectorInput: {
      width: 300,
    },
  }))();

  const [selectedCampaign, setSelectedCampaign] = useState<TODOFIXANY>();
  const [validAdSets, setValidAdSets] = useState<TODOFIXANY[]>([]);
  const [selectedAdSet, setSelectedAdSet] = useState();
  const { adLimit, ads, adSetLimit, adSets, campaigns, isCampaignLimitMax } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const campaignIdToNumChildren = useLimitInfoStore((state) => state.campaignIdToNumChildren);
  const adSetIdToNumChildren = useLimitInfoStore((state) => state.adSetIdToNumChildren);
  const backendStatuses = useDisplayStatusesStore((state) => state.campaignStatuses);

  const eligibleCampaigns = (campaigns || []).filter((campaignObj: TODOFIXANY) => {
    const campaignEndDateIsInTheFuture = campaignObj.end_timestamp_ms >= Date.now();
    const campaignHasNoEndDate = campaignObj.end_timestamp_ms === 0;
    const campaignCanceled =
      GetBackendCampaignStatusText(backendStatuses, campaignObj.id) ===
      StatusText.DISPLAY_STATUS_CANCELED;
    const campaignNotCpv15 = campaignObj.objective !== 3;
    return (
      (campaignEndDateIsInTheFuture || campaignHasNoEndDate) &&
      !campaignCanceled &&
      campaignNotCpv15
    );
  });

  const isCreateNewAdModal = format === EntityTypeEnum.AD;
  const childAdDetails = ads?.find((ad) => ad.ad_set_id === selectedAdSet);
  const isSponsoredOrSearch =
    childAdDetails?.type === ServerAdType.SPONSORED_UNIVERSE ||
    childAdDetails?.type === ServerAdType.SEARCH;

  const disableAddingNewAdToVisitsCampaign = isCreateNewAdModal && isSponsoredOrSearch;

  useEffect(() => {
    if (campaigns && eligibleCampaigns.length === 0) {
      onNewCampaignButtonClicked();
    }
  }, []);

  if (!campaigns || !adSets) {
    return <CenteredCircularProgress />;
  }
  // @ts-ignore
  const closeModal = (...args) => {
    onClose(...args);
  };

  const setValidAdSetsBasedOnCampaignId = (campaignId: string) => {
    const matchingAdSets = adSets.filter((adSet) => {
      return adSet.campaign_id === campaignId;
    });

    setValidAdSets(matchingAdSets);
  };

  const disableNextButton = () => {
    if (disableAddingNewAdToVisitsCampaign) {
      return true;
    }
    if (format === EntityTypeEnum.AD) {
      return selectedCampaign === undefined || selectedAdSet === undefined;
    }
    return selectedCampaign === undefined;
  };

  const disableNewAdSetButton = () => {
    if (selectedCampaign === undefined) return true;
    if (campaignIdToNumChildren.get(selectedCampaign) === undefined) return false;
    return !!adSetLimit && campaignIdToNumChildren.get(selectedCampaign)! >= adSetLimit;
  };

  const disableAdSetSelector = () => {
    return selectedCampaign === undefined;
  };

  const newCampaignButtonTooltip = () => {
    if (shouldDisableCampaignCreation) {
      return isCampaignLimitMax ? (
        <>
          You have reached the maximum number of campaigns allowed for your account. Please{' '}
          <Link
            color='inherit'
            href='https://www.roblox.com/support'
            rel='noopener'
            target='_blank'
            underline='always'>
            contact support
          </Link>{' '}
          for assistance.
        </>
      ) : (
        GetTooltipText('Disabled.CampaignLimitReached')
      );
    }
    return '';
  };

  const newAdSetButtonTooltip = () => {
    if (selectedCampaign === undefined) {
      return '';
    }
    return disableNewAdSetButton() ? GetTooltipText('Disabled.AdSetLimitReached') : '';
  };

  const adCreationInputEl = (
    <div className={dialogInputSelectionRow}>
      <Select
        autoFocus
        classes={{
          root: selectorInput,
        }}
        data-testid='adset-dropdown-selector'
        disabled={disableAdSetSelector()}
        label='Ad Set'
        onChange={(e: TODOFIXANY) => {
          setSelectedAdSet(e.target.value);
        }}
        value={selectedCampaign}>
        {validAdSets.map((adSetObj: TODOFIXANY) => {
          const disableOption =
            !!adLimit &&
            adSetIdToNumChildren.get(adSetObj.id) !== undefined &&
            adSetIdToNumChildren.get(adSetObj.id)! >= adLimit;
          const menuItem = (
            <MenuItem
              data-testid='adset-dropdown-option'
              disabled={disableOption}
              key={adSetObj.id}
              value={adSetObj.id}>
              {adSetObj.name}
            </MenuItem>
          );
          return disableOption ? (
            <Tooltip placement='right' title={GetTooltipText('Disabled.AdLimitReached')}>
              <div>{menuItem}</div>
            </Tooltip>
          ) : (
            menuItem
          );
        })}
      </Select>
      <OrDivider />
      <Tooltip arrow placement='right' title={newAdSetButtonTooltip()}>
        <div>
          <Button
            color='primaryBrand'
            disabled={disableNewAdSetButton()}
            onClick={(e: TODOFIXANY) => {
              onNewAdSetButtonClicked(e, selectedCampaign);
            }}
            variant='text'>
            New Ad Set
          </Button>
        </div>
      </Tooltip>
    </div>
  );

  return (
    <DialogContent>
      <div className={dialogRow}>
        <Typography classes={{ root: relativeLeftAligned }} variant='h3'>
          Create New Ad {format === EntityTypeEnum.ADSET ? 'Set' : ''}
        </Typography>
        <ClearIcon
          classes={{ root: `${relativeRightAligned} ${iconButton}` }}
          onClick={closeModal}
        />
      </div>
      <div className={dialogRow}>
        <Typography classes={{ root: relativeLeftAligned }} variant='h4'>
          Add Ad {format === EntityTypeEnum.ADSET ? 'Set ' : ''}To:
        </Typography>
      </div>
      <div className={dialogInputSelectionRow}>
        <Select
          autoFocus
          classes={{
            root: selectorInput,
          }}
          data-testid='campaign-dropdown-selector'
          label='Campaign'
          onChange={(e: TODOFIXANY) => {
            const newSelectedCampaign = e.target.value;
            setSelectedCampaign(newSelectedCampaign);
            setValidAdSetsBasedOnCampaignId(newSelectedCampaign);
          }}
          value={selectedCampaign}>
          {eligibleCampaigns.map((campaignObj: TODOFIXANY) => {
            const disableOption =
              format === EntityTypeEnum.ADSET &&
              !!adSetLimit &&
              campaignIdToNumChildren.get(campaignObj.id) !== undefined &&
              campaignIdToNumChildren.get(campaignObj.id)! >= adSetLimit;
            const menuItem = (
              <MenuItem
                data-testid='campaign-dropdown-option'
                disabled={disableOption}
                key={campaignObj.id}
                value={campaignObj.id}>
                {campaignObj.name}
              </MenuItem>
            );

            if (disableOption) {
              return (
                <Tooltip
                  key={campaignObj.id}
                  placement='right'
                  title={GetTooltipText('Disabled.AdSetLimitReached')}>
                  <div>{menuItem}</div>
                </Tooltip>
              );
            }

            return menuItem;
          })}
        </Select>
        <OrDivider />
        <Tooltip arrow placement='right' title={newCampaignButtonTooltip()}>
          <div>
            <Button
              color='primaryBrand'
              disabled={shouldDisableCampaignCreation}
              onClick={(e: TODOFIXANY) => {
                onNewCampaignButtonClicked(e);
              }}
              variant='text'>
              New Campaign
            </Button>
          </div>
        </Tooltip>
      </div>
      {format === EntityTypeEnum.ADSET ? null : adCreationInputEl}
      <div className={dialogRow}>
        <span className={ctaButton}>
          <Button color='primaryBrand' onClick={closeModal} variant='outlined'>
            Cancel
          </Button>
        </span>

        <Tooltip
          placement='right'
          title={
            disableAddingNewAdToVisitsCampaign
              ? GetTooltipText('Disabled.VisitsBasedCampaignIsSingleUniverseOnly')
              : ''
          }>
          <span className={ctaButton}>
            <Button
              color='primaryBrand'
              data-testid='next-button'
              disabled={disableNextButton()}
              onClick={(e: TODOFIXANY) => {
                if (format === EntityTypeEnum.AD) {
                  onNewAdButtonClicked(e, selectedCampaign, selectedAdSet);
                }
                if (format === EntityTypeEnum.ADSET) {
                  onNewAdSetButtonClicked(e, selectedCampaign);
                }
              }}
              variant='contained'>
              Next
            </Button>
          </span>
        </Tooltip>
      </div>
    </DialogContent>
  );
};

export default CreateNewAdOrAdSetPrompt;
