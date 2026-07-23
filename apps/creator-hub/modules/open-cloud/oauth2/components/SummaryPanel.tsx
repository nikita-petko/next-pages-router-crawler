import { useTranslation } from '@rbx/intl';
import { Accordion, AccordionDetails, Grid, Typography, AccordionSummary } from '@rbx/ui';
import PermissionsPanel from './PermissionsPanel';
import RedirectUrisPanel from './RedirectUrisPanel';
import SummaryGeneralInformationPanel from './SummaryGeneralInformationPanel';
import useSummaryPanelStyles from './SummaryPanel.styles';

interface SummaryPanelProps {
  allowedScopes: { [name: string]: Set<string> };
  setAllowedScopesHandler: (
    allowedScopes: { [name: string]: Set<string> },
    isInit: boolean,
  ) => void;
  name: string;
  description: string;
  imageAssetId: number | null;
  imageUrl?: string;
  tosUri: string;
  privacyPolicyUri: string;
  entryPointUri: string;
  setAppNameHandler: (name: string) => void;
  setAppDescriptionHandler: (description: string) => void;
  setAppImageFileHandler: (imageFile: File | null) => void;
  setAppTosUriHandler: (tosUri: string) => void;
  setAppPrivacyPolicyUriHandler: (privacyPolicyUri: string) => void;
  setAppEntryPointUriHandler: (privacyPolicyUri: string) => void;
  redirectUris: string[];
  setRedirectUrisHandler: (redirectUris: string[]) => void;
  isEditActive?: boolean;
  isFirstPartyApp?: boolean;
}

const SummaryPanel = ({
  allowedScopes,
  setAllowedScopesHandler,
  name,
  description,
  imageAssetId,
  imageUrl,
  tosUri,
  privacyPolicyUri,
  entryPointUri,
  setAppNameHandler,
  setAppDescriptionHandler,
  setAppImageFileHandler,
  setAppTosUriHandler,
  setAppPrivacyPolicyUriHandler,
  redirectUris,
  setRedirectUrisHandler,
  setAppEntryPointUriHandler,
  isEditActive,
  isFirstPartyApp,
}: SummaryPanelProps) => {
  const {
    classes: { header, permissionsPanel, accordionPanel, firtAccordionPanel },
  } = useSummaryPanelStyles();
  const { translate } = useTranslation();
  return (
    <>
      <Grid classes={{ root: firtAccordionPanel }}>
        <Accordion defaultExpanded className={accordionPanel}>
          <AccordionSummary>
            <Typography classes={{ root: header }} variant='h6'>
              {translate('Label.GeneralInformation')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <SummaryGeneralInformationPanel
              name={name}
              description={description}
              imageAssetId={imageAssetId}
              imageUrl={imageUrl}
              tosUri={tosUri}
              privacyPolicyUri={privacyPolicyUri}
              entryPointUri={entryPointUri}
              setAppNameHandler={setAppNameHandler}
              setAppDescriptionHandler={setAppDescriptionHandler}
              setAppImageFileHandler={setAppImageFileHandler}
              setAppTosUriHandler={setAppTosUriHandler}
              setAppPrivacyPolicyUriHandler={setAppPrivacyPolicyUriHandler}
              isEditActive={isEditActive}
              setAppEntryPointUriHandler={setAppEntryPointUriHandler}
            />
          </AccordionDetails>
        </Accordion>
      </Grid>
      <Grid classes={{ root: accordionPanel }}>
        <Accordion defaultExpanded>
          <AccordionSummary>
            <Typography classes={{ root: header }} variant='h6'>
              {translate('Label.Permissions')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails classes={{ root: permissionsPanel }}>
            <PermissionsPanel
              allowedScopes={allowedScopes}
              setAllowedScopesHandler={setAllowedScopesHandler}
              isEditActive={isEditActive}
              isFirstPartyApp={isFirstPartyApp}
            />
          </AccordionDetails>
        </Accordion>
      </Grid>
      <Grid classes={{ root: accordionPanel }}>
        <Accordion defaultExpanded>
          <AccordionSummary>
            <Typography classes={{ root: header }} variant='h6'>
              {translate('Label.RedirectUris')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <RedirectUrisPanel
              redirectUris={redirectUris}
              setRedirectUrisHandler={setRedirectUrisHandler}
              isEditActive={isEditActive}
            />
          </AccordionDetails>
        </Accordion>
      </Grid>
    </>
  );
};

export default SummaryPanel;
