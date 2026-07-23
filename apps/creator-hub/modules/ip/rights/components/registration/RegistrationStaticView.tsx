import React from 'react';
import { Grid, Typography, List, ListItem } from '@rbx/ui';
import { Account, AccountAccountTypeEnum, User } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SecondaryListItemText from '../common/SecondaryListItemText';

interface RegistrationStaticViewProps {
  account: Account;
  user: User;
}

function RegistrationStaticView({ account, user }: RegistrationStaticViewProps) {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <Grid item container direction='column' flexGrow={1} spacing={3}>
      <Grid item>
        <Typography variant='h3'>{translate('Heading.RightsHolder')}</Typography>
      </Grid>
      <Grid item container width='60vh' spacing={2}>
        <List>
          <ListItem dense>
            <SecondaryListItemText
              primary={
                account.accountType === AccountAccountTypeEnum.Individual
                  ? translate('Label.Myself')
                  : translate('Label.RightsHolderCorporate')
              }
              secondary={translate('Label.RightsHolderType')}
            />
          </ListItem>
          <ListItem dense>
            <SecondaryListItemText
              primary={user.fullName}
              secondary={translate('Label.YourFullName')}
            />
          </ListItem>
          {account.accountType === AccountAccountTypeEnum.Corporate && (
            <ListItem dense>
              <SecondaryListItemText
                primary={account.organizationName}
                secondary={translate('Label.OrgOrClientName')}
              />
            </ListItem>
          )}
        </List>
      </Grid>
      <Grid item>
        <Typography variant='h3'>{translate('Heading.Address')}</Typography>
      </Grid>
      <Grid item container width='60vh' spacing={2}>
        <List>
          <ListItem dense>
            <SecondaryListItemText
              primary={user.address}
              secondary={translate('Label.AddressLine1')}
            />
          </ListItem>
          {user.address2?.trim() && (
            <ListItem dense>
              <SecondaryListItemText
                primary={user.address2}
                secondary={translate('Label.AddressLine2')}
              />
            </ListItem>
          )}
          <ListItem dense>
            <SecondaryListItemText primary={user.city} secondary={translate('Label.City')} />
          </ListItem>
          <ListItem dense>
            <SecondaryListItemText primary={user.state} secondary={translate('Label.State')} />
          </ListItem>
          <ListItem dense>
            <SecondaryListItemText primary={user.country} secondary={translate('Label.Country')} />
          </ListItem>
          <ListItem dense>
            <SecondaryListItemText primary={user.postalCode} secondary={translate('Label.Zip')} />
          </ListItem>
        </List>
      </Grid>
      <Grid item>
        <Typography variant='h3'>{translate('Heading.LegalAgreements')}</Typography>
      </Grid>
      <Grid item container width='60vh' spacing={2}>
        <List>
          <ListItem dense>
            <SecondaryListItemText
              primary={user.signature}
              secondary={translate('Label.Signature')}
            />
          </ListItem>
        </List>
      </Grid>
    </Grid>
  );
}

export default withTranslation(RegistrationStaticView, [TranslationNamespace.RightsPortal]);
