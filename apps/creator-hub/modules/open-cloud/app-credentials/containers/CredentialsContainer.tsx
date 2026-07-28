import { useRouter } from 'next/router';
import { Fragment, useReducer, useCallback, useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { HubMeta } from '@rbx/creator-hub-history';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Link, Grid, CircularProgress, Typography, List, ListItem, ListItemText } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import GroupApiKeyInfoBanner from '../../api-keys/components/v1/GroupApiKeyInfoBanner';
import useGroupApiKeyInfoBannerStyles from '../../api-keys/components/v1/GroupApiKeyInfoBanner.styles';
import ApiKeysContainer from '../../api-keys/containers/ApiKeysContainer';
import type FormModeState from '../../api-keys/interfaces/FormModeState';
import ToastProvider from '../../common/providers/ToastProvider';
import OAuthContainer from '../../oauth2/containers/OAuthContainer';
import type OAuthFormModeState from '../../oauth2/interfaces/OAuthFormModeState';
import useOAuthMetadata from '../../oauth2/OAuthMetadataContext';
import CredentialsTabsStates from '../enums/CredentialsTabsStates';
import formModeReducer, {
  FormActionTypes,
  initialFormModeState,
} from '../reducers/formModeReducer';
import useCredentialStyles from './Credentials.styles';

const { docs } = creatorHub;

const CredentialsContainer = () => {
  const {
    classes: { section, header, groupApiKeyInfoBanner, learnMoreLink },
  } = useCredentialStyles();
  const {
    classes: { warningList, warningListItem },
  } = useGroupApiKeyInfoBannerStyles({ headingPaddingBottom: '8px' });
  const [{ apiKeyFormState, oAuthFormState, areTabsActive }, dispatch] = useReducer(
    formModeReducer,
    initialFormModeState,
  );

  const OAuthMetadata = useOAuthMetadata();
  const currentGroup = useCurrentGroup();

  const setApiKeyFormStateHelper = useCallback((mode: FormModeState) => {
    dispatch({
      type: FormActionTypes.SetApiKeyFormState,
      payload: mode,
    });
  }, []);

  const setOAuthFormStateHelper = useCallback((mode: OAuthFormModeState) => {
    dispatch({
      type: FormActionTypes.SetOAuthFormState,
      payload: mode,
    });
  }, []);

  const router = useRouter();
  const activeTabState = useMemo(() => {
    const { activeTab } = router.query;
    if (!Object.values(CredentialsTabsStates).includes(activeTab as CredentialsTabsStates)) {
      return CredentialsTabsStates.ApiKeysTab;
    }
    return activeTab as CredentialsTabsStates;
  }, [router]);
  const { translate, translateHTML } = useTranslation();

  const TranslateList = {
    opening: 'listStart',
    closing: 'listEnd',
    content(chunks: React.ReactNode) {
      return <List classes={{ root: warningList }}>{chunks}</List>;
    },
  };

  const TranslateListItem = {
    opening: 'listItemStart',
    closing: 'listItemEnd',
    content(chunks: React.ReactNode) {
      return (
        <ListItem classes={{ root: warningListItem }}>
          <ListItemText primary={chunks} />
        </ListItem>
      );
    },
  };

  if (process.env.buildTarget !== 'global') {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (OAuthMetadata.isLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (OAuthMetadata.hasError) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center' variant='body2'>
          {translate('Message.ErrorLoadingOAuthMetadata')}
        </Typography>
      </EmptyGrid>
    );
  }
  const pageTitle =
    activeTabState === CredentialsTabsStates.ApiKeysTab
      ? translate('Heading.ApiExtensions')
      : translate('Label.OAuthApps');

  return (
    <ToastProvider>
      <>
        <HubMeta title={pageTitle} />
        {areTabsActive && (
          <Grid className={header}>
            {activeTabState === CredentialsTabsStates.ApiKeysTab && currentGroup?.id && (
              <GroupApiKeyInfoBanner
                severity='error'
                heading={translate('Heading.GroupAPIKeyError')}
                description={translateHTML('Description.GroupAPIKeyError', [
                  TranslateList,
                  TranslateListItem,
                ])}
                headingPaddingBottom='16px'
                className={groupApiKeyInfoBanner}
                action={
                  <Link
                    href='https://devforum.roblox.com/t/api-key-consolidation-deprecating-group-owned-api-keys/4068530'
                    target='_blank'
                    className={learnMoreLink}>
                    {translate('Label.LearnMore')}
                  </Link>
                }
              />
            )}
            <Typography component='body1' variant='body1'>
              <span>
                {activeTabState === CredentialsTabsStates.ApiKeysTab
                  ? translate('Description.ApiKeyExtension')
                  : translate('Description.OAuthApiExtension')}
              </span>
              &nbsp;
              <span>
                {activeTabState === CredentialsTabsStates.ApiKeysTab
                  ? ''
                  : translateHTML('Description.LearnApis', [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content(chunks) {
                          return <Link href={docs.getOpenCloudReferenceUrl()}>{chunks}</Link>;
                        },
                      },
                    ])}
              </span>
            </Typography>
          </Grid>
        )}

        <section className={section}>
          {activeTabState === CredentialsTabsStates.ApiKeysTab && (
            <ApiKeysContainer
              formModeState={apiKeyFormState}
              setFormModeState={setApiKeyFormStateHelper}
            />
          )}
          {activeTabState === CredentialsTabsStates.OAuthTab && (
            <OAuthContainer
              oAuthFormModeState={oAuthFormState}
              setOAuthFormModeState={setOAuthFormStateHelper}
            />
          )}
        </section>
      </>
    </ToastProvider>
  );
};

export default withTranslation(CredentialsContainer, [
  TranslationNamespace.OpenCloud,
  TranslationNamespace.OAuth,
  TranslationNamespace.ScopeSystem,
  TranslationNamespace.Controls,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
]);
