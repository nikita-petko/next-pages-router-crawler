import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApplicationAuthorizationsApiModelsResponseScopesConfigurationResponse } from '@rbx/client-application-authorizations-api/v1';
import { getProductionCreatorHubUrl, resolveUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, Link, Button, Alert } from '@rbx/ui';
import applicationAuthorizationClient from '@modules/clients/applicationAuthorization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useSnackbar from '../../common/hooks/useSnackbar';
import { IDENTITY_SCOPES } from '../constants/oAuthConstants';
import type ScopeOption from '../interfaces/ScopeOptions';
import { getOidcScopeOperationDescriptionTranslationKey } from '../utils/getTranslationKeysUtil';
import getDeveloperFacingScopes from '../utils/scopesUtil';
import usePermissionsPanelStyles from './PermissionsPanel.styles';
import ScopeAutocomplete from './ScopeAutocomplete';
import ScopeSelectionTable from './ScopeSelectionTable';

interface PermissionsPanelProps {
  allowedScopes: Record<string, Set<string>>;
  setAllowedScopesHandler: (allowedScopes: Record<string, Set<string>>, isInit: boolean) => void;
  isEditActive?: boolean;
  isFirstPartyApp?: boolean;
}

const PermissionsPanel = ({
  allowedScopes,
  setAllowedScopesHandler,
  isEditActive,
  isFirstPartyApp = false,
}: PermissionsPanelProps) => {
  const {
    classes: { body, retryButton, alertMargin },
  } = usePermissionsPanelStyles();
  const { translate, translateHTML } = useTranslation();
  const { showSnackbar, closeSnackbar } = useSnackbar();

  const hasSeededScopes = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [scopeConfiguration, setScopeConfiguration] =
    useState<ApplicationAuthorizationsApiModelsResponseScopesConfigurationResponse>();

  const getTranslatedDescription = useCallback(
    (operationDescriptionTranslationKey?: string | null) => {
      if (operationDescriptionTranslationKey != null) {
        const translatedDescription = translate(operationDescriptionTranslationKey);
        if (translatedDescription != null && translatedDescription.length > 0) {
          return translatedDescription;
        }
      }
      return translate('Label.NoDescriptionProvided');
    },
    [translate],
  );

  const loadConfiguration = useCallback(async () => {
    try {
      const configuration = await applicationAuthorizationClient.getScopesConfiguration();
      setScopeConfiguration(configuration);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: loadConfiguration only updates state after awaiting the request, so this does
    // not synchronously setState within the effect body.
    // oxlint-disable-next-line react/react-compiler
    void loadConfiguration();
  }, [loadConfiguration]);

  // All available scope options, derived from the loaded configuration. First-party-only scopes are
  // filtered out for third-party apps. OIDC scopes are kept first; the rest are sorted.
  const scopeOptions = useMemo<ScopeOption[]>(() => {
    if (scopeConfiguration === undefined) {
      return [];
    }

    const oidcOptions: ScopeOption[] = [];
    scopeConfiguration.oidcScopes.forEach((oidcScope) => {
      oidcOptions.push({
        scopeType: oidcScope,
        operation: 'read',
        description: getTranslatedDescription(
          getOidcScopeOperationDescriptionTranslationKey(oidcScope),
        ),
      });
    });

    const oauthOptions: ScopeOption[] = [];
    scopeConfiguration.scopes
      .filter((scope) => !scope.firstPartyOAuthOnly || isFirstPartyApp)
      .forEach((scope) => {
        if (scope.scopeType != null && scope.operation != null) {
          oauthOptions.push({
            scopeType: scope.scopeType,
            operation: scope.operation,
            description: getTranslatedDescription(scope.translationKey),
          });
        }
      });

    return oidcOptions.concat(
      oauthOptions.sort((a, b) =>
        getDeveloperFacingScopes(a.scopeType, a.operation).localeCompare(
          getDeveloperFacingScopes(b.scopeType, b.operation),
        ),
      ),
    );
  }, [scopeConfiguration, isFirstPartyApp, getTranslatedDescription]);

  // One-time initialization of allowedScopes (seeds an empty operation set per scope type in the parent).
  // Guarded with a ref rather than state so it does not trigger an extra render from within the effect.
  useEffect(() => {
    if (hasSeededScopes.current || scopeConfiguration === undefined) {
      return;
    }

    const allowedScopesInitializer: Record<string, Set<string>> = {};
    scopeOptions.forEach((option) => {
      allowedScopesInitializer[option.scopeType] = new Set();
    });

    setAllowedScopesHandler({ ...allowedScopesInitializer, ...allowedScopes }, true);
    hasSeededScopes.current = true;
  }, [scopeConfiguration, scopeOptions, allowedScopes, setAllowedScopesHandler]);

  // The currently selected options, derived from the available options and the allowed scopes.
  const selectedScopeOptions = useMemo<ScopeOption[]>(
    () =>
      scopeOptions.filter(
        (option) =>
          option.scopeType in allowedScopes &&
          allowedScopes[option.scopeType].has(option.operation),
      ),
    [allowedScopes, scopeOptions],
  );

  const { settings } = useSettings();

  // ensure that if an identity scope is selected, 'openid' is also selected
  const verifyIdentityScopes = useCallback(
    (scopes: Record<string, Set<string>>) => {
      IDENTITY_SCOPES.forEach((identityScope) => {
        if (
          scopes.openid !== undefined &&
          scopes.openid.size === 0 &&
          scopes[identityScope] !== undefined &&
          scopes[identityScope].size !== 0
        ) {
          showSnackbar(
            'error',
            translate('Heading.ScopeSelectionError'),
            translate('Message.ScopeSelectionError'),
            true,
          );
        } else {
          closeSnackbar();
        }
      });
    },
    [translate, showSnackbar, closeSnackbar],
  );

  const onScopeAdd = useCallback(
    (option: ScopeOption) => {
      const updatedScopes = { ...allowedScopes };
      updatedScopes[option.scopeType].add(option.operation);

      verifyIdentityScopes(updatedScopes);
      setAllowedScopesHandler(updatedScopes, false);
    },
    [allowedScopes, setAllowedScopesHandler, verifyIdentityScopes],
  );

  const onScopeDelete = useCallback(
    (option: ScopeOption) => {
      const updatedScopes = { ...allowedScopes };
      updatedScopes[option.scopeType].delete(option.operation);

      verifyIdentityScopes(updatedScopes);
      setAllowedScopesHandler(updatedScopes, false);
    },
    [allowedScopes, setAllowedScopesHandler, verifyIdentityScopes],
  );

  return hasError ? (
    <Grid container direction='column' alignItems='center'>
      <Typography variant='alertTitle'>{translate('Message.ErrorLoadingScopes')}</Typography>
      <Button
        className={retryButton}
        variant='outlined'
        size='large'
        onClick={() => {
          setHasError(false);
          setIsLoading(true);
          void loadConfiguration();
        }}>
        {translate('Label.TryAgain')}
      </Button>
    </Grid>
  ) : (
    <>
      <Grid container direction='column'>
        <Grid item className={body}>
          <Typography>
            {translateHTML('Description.PermissionsSection', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/auth/oauth2-registration#add-permissions`}
                      target='_blank'
                      underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
      </Grid>
      {isEditActive && settings.enableScopeSelectionCategoryWarning && (
        <Alert severity='warning' variant='standard' className={alertMargin}>
          <Typography>
            {translateHTML('Heading.ScopeSelectionCategoryWarning', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={resolveUrl(
                        'creatorThirdPartyPolicyUrl',
                        process.env.targetEnvironment,
                        process.env.buildTarget,
                      )}
                      target='_blank'
                      underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Alert>
      )}
      <ScopeAutocomplete
        isEditActive={isEditActive}
        isLoading={isLoading}
        scopeOptions={scopeOptions}
        selectedScopeOptions={selectedScopeOptions}
        onScopeAdd={onScopeAdd}
      />
      {(isLoading || selectedScopeOptions.length > 0) && (
        <ScopeSelectionTable
          isEditActive={isEditActive}
          isLoading={isLoading}
          selectedScopeOptions={selectedScopeOptions}
          onScopeDelete={onScopeDelete}
        />
      )}
    </>
  );
};

export default PermissionsPanel;
