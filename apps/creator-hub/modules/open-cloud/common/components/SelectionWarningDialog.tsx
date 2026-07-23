import { useState } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@rbx/ui';
import {
  luauExecutionSessionReadScope,
  luauExecutionSessionWriteScope,
} from '../utils/warningDialogUtil';
import useSelectionWarningDialogStyles from './SelectionWarningDialog.styles';

interface SelectionWarningDialogProps {
  open: boolean;
  continueText: string;
  onClose: () => void;
  onContinue: () => void;
  luauExecutionSessionsWarningEnabled: boolean;
  wildcardTargetPartWarningEnabled: boolean;
  groupApiKeyWarningEnabled: boolean;
}

const SelectionWarningDialog = ({
  open,
  continueText,
  onClose,
  onContinue,
  luauExecutionSessionsWarningEnabled,
  wildcardTargetPartWarningEnabled,
  groupApiKeyWarningEnabled,
}: SelectionWarningDialogProps) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: {
      warningList,
      luauWarningList,
      warningListItem,
      acknowledgementCheckbox,
      dialog,
      warningBox,
      learnMoreLink,
      alertTitle,
    },
  } = useSelectionWarningDialogStyles();

  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAcknowledged(event.target.checked);
  };

  const handleClose = () => {
    setIsAcknowledged(false);
    onClose();
  };

  const handleContinue = () => {
    setIsAcknowledged(false);
    onContinue();
  };

  const links = {
    engineApiLink: `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine`,
    groupApiKeyDevForumLink:
      'https://devforum.roblox.com/t/api-key-consolidation-deprecating-group-owned-api-keys/4068530',
    manageGroupOwnedResourcesLink: `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/auth/api-keys#create-api-keys-for-managing-group-owned-resources`,
  };

  type LinkKeys = keyof typeof links;

  const TranslateList = {
    opening: 'listStart',
    closing: 'listEnd',
    content(chunks: React.ReactNode) {
      return <List classes={{ root: warningList }}>{chunks}</List>;
    },
  };

  const TranslateLuauList = {
    opening: 'listStart',
    closing: 'listEnd',
    content(chunks: React.ReactNode) {
      return <List classes={{ root: luauWarningList }}>{chunks}</List>;
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

  const translateLink = (key: LinkKeys) => {
    return {
      opening: `${key}Start`,
      closing: `${key}End`,
      content(chunks: React.ReactNode) {
        return (
          <Link href={links[key]} target='_blank'>
            {chunks}
          </Link>
        );
      },
    };
  };

  const luauExecutionSessionsWarning = (
    <Alert
      severity='warning'
      variant='outlined'
      className={warningBox}
      action={
        <Link href={links.engineApiLink} target='_blank' className={learnMoreLink}>
          {translate('Label.LearnMore')}
        </Link>
      }>
      <AlertTitle className={alertTitle}>
        {translate('Message.LuauExecutionSessionScopeWarningInformation', {
          luauExecutionSessionReadScope,
          luauExecutionSessionWriteScope,
        })}
      </AlertTitle>
      <Typography variant='body1' component='div'>
        {translateHTML('Description.LuauExecutionSessionWarningInformationDetails', [
          TranslateLuauList,
          TranslateListItem,
          translateLink('engineApiLink'),
        ])}
      </Typography>
    </Alert>
  );

  const wildcardTargetPartWarning = (
    <Alert
      severity='error'
      variant='outlined'
      className={warningBox}
      action={
        <Link href={links.manageGroupOwnedResourcesLink} target='_blank' className={learnMoreLink}>
          {translate('Label.LearnMore')}
        </Link>
      }>
      <AlertTitle className={alertTitle}>{translate('Heading.WildcardUsageSaveAlert')}</AlertTitle>
      <Typography variant='body1' component='div'>
        {translateHTML('Description.WildcardUsageSaveAlert', [TranslateList, TranslateListItem])}
      </Typography>
    </Alert>
  );

  const groupApiKeyWarning = (
    <Alert
      severity='error'
      variant='outlined'
      className={warningBox}
      action={
        <Link href={links.groupApiKeyDevForumLink} target='_blank' className={learnMoreLink}>
          {translate('Label.LearnMore')}
        </Link>
      }>
      <AlertTitle className={alertTitle}>{translate('Heading.GroupAPIKeySaveAlert')}</AlertTitle>
      <Typography variant='body1' component='div'>
        {translate('Description.GroupAPIKeySaveAlert')}
      </Typography>
    </Alert>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      className={dialog}>
      <DialogTitle id='alert-dialog-title'>
        <Typography variant='h2'>{translate('Heading.SecurityWarning')}</Typography>
      </DialogTitle>
      <Divider variant='middle' size='medium' />
      <DialogContent>
        {groupApiKeyWarningEnabled && groupApiKeyWarning}
        {wildcardTargetPartWarningEnabled && wildcardTargetPartWarning}
        {luauExecutionSessionsWarningEnabled && luauExecutionSessionsWarning}
        <FormControlLabel
          control={
            <Checkbox
              color='primary'
              inputProps={{ 'aria-label': 'controlled' }}
              checked={isAcknowledged}
              onChange={handleCheckboxChange}
            />
          }
          label={
            <Typography variant='body1'>
              {translate('Message.UnderstandSecurityWarning')}
            </Typography>
          }
          classes={{ root: acknowledgementCheckbox }}
        />
      </DialogContent>
      <Divider variant='middle' size='medium' />
      <DialogActions>
        <Button onClick={handleClose} size='large' color='primary' variant='outlined' autoFocus>
          {translate('Button.Cancel')}
        </Button>
        <Button
          onClick={handleContinue}
          size='large'
          color='primaryBrand'
          disabled={!isAcknowledged}
          variant='contained'
          autoFocus>
          {continueText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectionWarningDialog;
