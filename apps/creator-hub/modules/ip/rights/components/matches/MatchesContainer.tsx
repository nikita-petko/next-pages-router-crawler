import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Grid, Typography, Tabs, Tab, Alert, Button } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { AccountStatusEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useLocalStorage } from '@rbx/react-utilities';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';
import useScrollRef from '../../helpers/useScrollRef';
import SearchContainer from './SearchContainer';
import useCart from './useCart';
import { AccountsURL } from '../createRemovalRequest/CreateRemovalRequestContainer';
import CreateSearchRemovalRequestContainer from './CreateSearchRemovalRequestContainer';
import CreateSearchClaimContainer from './CreateSearchClaim/CreateSearchClaimContainer';
import { ClaimsURL } from '../claims/ClaimsContainer';
import { SearchSource, getCategoryTLKey } from './SearchEnums';
import ExperiencesContainer from './ExperiencesContainer';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

const LOCAL_STORAGE_ONE_LINK_ALERT_ACK_KEY = 'rightsSearchOneLinkAlertAck';

export const MatchesURL = '/dashboard/rights-manager/matches';
/**
 *  MatchesContainer is the landing page for the matches tab.
 */
const MatchesContainer = () => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const { account, features } = useCurrentAccountContext();
  const [isCreatingRemoval, setIsCreatingRemoval] = useState(false);
  const [currentSource, setCurrentSource] = useState(SearchSource.Avatar);
  const [originalContent, setOriginalContent] =
    useState<RobloxGamesApiModelsResponsePlaceDetails | null>(null);
  // searchCart is empty for normal search backwards compatibility
  const searchCart = useCart();
  // experiencesCart is used for the experiences tab, using unique cart key
  const experiencesCart = useCart('experiences');

  const [oneLinkAlertAck, setOneLinkAlertAck] = useLocalStorage(
    LOCAL_STORAGE_ONE_LINK_ALERT_ACK_KEY,
    false,
  );

  const {
    isFetched: isIXPFetched,
    params: { enableOnDemandSearch },
  } = useIXPParameters(IXPLayers.RightsManager);

  const shouldShowExperience = features?.enableTopExperienceMatch;

  useEffect(() => {
    if (shouldShowExperience) {
      setCurrentSource(SearchSource.Experience);
    }
  }, [shouldShowExperience]);

  const { scrollRef } = useScrollRef();

  if (!ready || !isIXPFetched) {
    return <PageLoading />;
  }

  if (account?.status !== AccountStatusEnum.Verified) {
    return null;
  }

  const createClaimDisplayMode = isCreatingRemoval ? '' : 'none';
  const searchDisplaymode = isCreatingRemoval ? 'none' : '';

  const onBack = () => {
    scrollRef?.scrollTo(0, 0);
    setIsCreatingRemoval(false);
  };

  const onSearchSuccess = () => {
    searchCart.clear();
    scrollRef?.scrollTo(0, 0);
    setIsCreatingRemoval(false);
    router.push(features?.enableClaimsAndDisputes ? ClaimsURL : AccountsURL);
  };

  const onExperienceSuccess = () => {
    experiencesCart.clear();
    scrollRef?.scrollTo(0, 0);
    setIsCreatingRemoval(false);
    router.push(features?.enableClaimsAndDisputes ? ClaimsURL : AccountsURL);
  };
  const cart = currentSource === SearchSource.Experience ? experiencesCart : searchCart;
  const onSuccess =
    currentSource === SearchSource.Experience ? onExperienceSuccess : onSearchSuccess;

  const creatingContainer = features?.enableClaimsAndDisputes ? (
    <CreateSearchClaimContainer
      onBack={onBack}
      onSuccess={onSuccess}
      cart={cart}
      originalContent={originalContent}
      isExperienceSearch={currentSource === SearchSource.Experience}
    />
  ) : (
    <CreateSearchRemovalRequestContainer
      onBack={onBack}
      onSuccess={onSuccess}
      cart={cart}
      originalContent={originalContent}
      isExperienceSearch={currentSource === SearchSource.Experience}
    />
  );

  // Tabs logic
  const experienceTab = (
    <Tab
      label={translate(getCategoryTLKey(SearchSource.Experience))}
      value={SearchSource.Experience}
    />
  );
  const avatarTab = (
    <Tab label={translate(getCategoryTLKey(SearchSource.Avatar))} value={SearchSource.Avatar} />
  );
  const developmentTab = (
    <Tab
      label={translate(getCategoryTLKey(SearchSource.Development))}
      value={SearchSource.Development}
    />
  );
  const tabs = [];
  if (shouldShowExperience) {
    tabs.push(experienceTab);
  }
  if (enableOnDemandSearch) {
    tabs.push(avatarTab, developmentTab);
  }
  if (tabs.length === 0) {
    return null;
  }
  const mainContent =
    currentSource === SearchSource.Experience ? (
      <ExperiencesContainer
        onSubmit={() => {
          scrollRef?.scrollTo(0, 0);
          setIsCreatingRemoval(true);
        }}
        account={account}
        setOriginalContent={setOriginalContent}
        cart={experiencesCart}
        isClaimsAndDisputesEnabled={features?.enableClaimsAndDisputes}
      />
    ) : (
      <SearchContainer
        onSubmit={() => {
          scrollRef?.scrollTo(0, 0);
          setIsCreatingRemoval(true);
        }}
        cart={searchCart}
        currentSource={currentSource}
      />
    );

  const shouldShowOnlyOneLinkAlert = !oneLinkAlertAck;

  return (
    <React.Fragment>
      <div style={{ display: createClaimDisplayMode }}>{creatingContainer}</div>
      <Grid display={searchDisplaymode} container direction='column' spacing={3}>
        <Grid item>
          {shouldShowOnlyOneLinkAlert && (
            <Grid direction='row' item container XSmall={12}>
              <Grid item XSmall={12}>
                <Alert
                  severity='info'
                  action={
                    <Button
                      color='inherit'
                      variant='text'
                      size='small'
                      onClick={() => {
                        setOneLinkAlertAck(true);
                      }}>
                      {translate('Action.GotIt')}
                    </Button>
                  }>
                  <Typography variant='body1'>{translate('Description.FilingLimit')}</Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </Grid>
        <Grid item container spacing={2} direction='column'>
          <Grid item paddingBottom={3}>
            <Typography variant='body1' color='secondary'>
              {translate('Label.MatchesExplanation')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item>
          <Tabs
            value={currentSource}
            onChange={(_, newValue) => setCurrentSource(newValue)}
            variant='scrollable'
            sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '0px' }}
            scrollButtons='auto'>
            {tabs}
          </Tabs>
        </Grid>
        <Grid item>{mainContent}</Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withTranslation(MatchesContainer, [TranslationNamespace.RightsPortal]);
