import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { SegmentedControl } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Checkbox, FormControlLabel, FormLabel, Grid, Typography } from '@rbx/ui';
import type { ConfigureExperienceFormType } from '../ConfigureExperienceTypes';
import { Audience, Privacy } from '../ConfigureExperienceTypes';

type AudienceToggleValue = 'limited' | 'public' | 'editors';

type AudienceControlsProps = {
  control: Control<ConfigureExperienceFormType>;
  isGroup: boolean;
  groupName: string;
};

const getToggleValue = (audiences: Audience[] | undefined): AudienceToggleValue => {
  if (!audiences || audiences.length === 0) {
    return 'editors';
  }
  if (audiences.includes(Audience.Public)) {
    return 'public';
  }
  if (audiences.length === 1 && audiences[0] === Audience.Editors) {
    return 'editors';
  }
  return 'limited';
};

const isAudienceToggleValue = (value: string): value is AudienceToggleValue =>
  value === 'editors' || value === 'limited' || value === 'public';

const AudienceControls: FunctionComponent<AudienceControlsProps> = ({
  control,
  isGroup,
  groupName,
}) => {
  const { translate } = useTranslation();
  const { field: audiencesField } = useController({ control, name: 'audiences' });
  const { field: privacyField } = useController({ control, name: 'privacy' });
  const audiences = audiencesField.value;

  const toggleValue = getToggleValue(audiences);

  const hasPlayTesters = audiences?.includes(Audience.PlayTesters) ?? false;
  const hasFriends = audiences?.includes(Audience.Friends) ?? false;
  const limitedCount = [hasPlayTesters, hasFriends].filter(Boolean).length;
  const isOnlySelection = limitedCount === 1;

  const handleToggleChange = useCallback(
    (newValue: string) => {
      if (!isAudienceToggleValue(newValue)) {
        return;
      }
      switch (newValue) {
        case 'editors':
          audiencesField.onChange([Audience.Editors]);
          privacyField.onChange(Privacy.Private);
          break;
        case 'public':
          audiencesField.onChange([Audience.Public]);
          privacyField.onChange(Privacy.Public);
          break;
        case 'limited':
          audiencesField.onChange([Audience.PlayTesters, Audience.Friends]);
          privacyField.onChange(Privacy.Public);
          break;
      }
    },
    [audiencesField, privacyField],
  );

  const handleCheckboxChange = useCallback(
    (audience: Audience, checked: boolean) => {
      const current =
        audiences?.filter((a) => a !== Audience.Editors && a !== Audience.Public) ?? [];
      let next: Audience[];
      if (checked) {
        next = [...current, audience];
      } else {
        next = current.filter((a) => a !== audience);
      }
      if (next.length === 0) {
        return;
      }
      audiencesField.onChange(next);
    },
    [audiences, audiencesField],
  );

  const friendsLabel = isGroup
    ? translate('Label.AudienceCommunityMember', {
        groupName,
      })
    : translate('Label.AudienceFriends');

  const toggleItems = useMemo(
    () => [
      { value: 'editors', label: translate('Label.AudiencePrivate') },
      { value: 'limited', label: translate('Label.AudienceLimited') },
      { value: 'public', label: translate('Label.AudiencePublic') },
    ],
    [translate],
  );

  return (
    <Grid container item XSmall={12} style={{ paddingBottom: 16 }}>
      <Grid item XSmall={12}>
        <FormLabel>{translate('Label.Audience')}</FormLabel>
      </Grid>
      <Grid item XSmall={12}>
        <Typography variant='smallLabel1' color='secondary'>
          {translate('Description.AudienceSelection')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} style={{ marginTop: 16 }}>
        <SegmentedControl
          variant='Text'
          fillBehaviour='Hug'
          value={toggleValue}
          onValueChange={handleToggleChange}
          items={toggleItems}
          aria-label={translate('Label.Audience')}
        />
      </Grid>
      {toggleValue === 'editors' && (
        <Grid item XSmall={12} style={{ marginTop: 16 }}>
          <Typography variant='smallLabel1' color='secondary'>
            {translate('Description.AudiencePrivate')}
          </Typography>
        </Grid>
      )}
      {toggleValue === 'public' && (
        <Grid item XSmall={12} style={{ marginTop: 16 }}>
          <Typography variant='smallLabel1' color='secondary'>
            {translate('Description.AudiencePublic')}
          </Typography>
        </Grid>
      )}
      {toggleValue === 'limited' && (
        <Grid container direction='column' item XSmall={12} style={{ marginTop: 8, marginLeft: 8 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasPlayTesters}
                disabled={hasPlayTesters && isOnlySelection}
                onChange={(e) => handleCheckboxChange(Audience.PlayTesters, e.target.checked)}
                aria-label={translate('Label.AudiencePlaytesters')}
                color='secondary'
              />
            }
            label={translate('Label.AudiencePlaytesters')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={hasFriends}
                disabled={hasFriends && isOnlySelection}
                onChange={(e) => handleCheckboxChange(Audience.Friends, e.target.checked)}
                aria-label={friendsLabel}
                color='secondary'
              />
            }
            label={friendsLabel}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default AudienceControls;
