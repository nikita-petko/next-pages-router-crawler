import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, useMediaQuery } from '@rbx/ui';
import type { TUser } from '@modules/authentication/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreatorSelect from '../common/CreatorSelect';
import useHeaderStyles from './Header.styles';

export interface Group {
  id: number;
  name: string;
}

interface ExperiencesHeaderProps {
  groups: Group[];
  user: TUser;
  isPublic: boolean;
  onGroupChange: (groupId: string) => void;
}

const ExperiencesHeader: FunctionComponent<ExperiencesHeaderProps> = ({
  groups,
  user,
  isPublic,
  onGroupChange,
}) => {
  const { translate } = useTranslation();

  const {
    classes: { container },
  } = useHeaderStyles();

  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  return (
    <div className={container} data-testid='experiences-header-container'>
      {!isSm &&
        (isPublic ? (
          <Typography marginBottom={4} variant='body1' component='p'>
            {translate('Description.PublicLuau')}
          </Typography>
        ) : (
          <Typography marginBottom={4} variant='body1' component='p'>
            {translate('Description.Experiences')}
          </Typography>
        ))}
      <CreatorSelect groups={groups} user={user} onGroupChange={onGroupChange} />
    </div>
  );
};

export default withTranslation(ExperiencesHeader, [TranslationNamespace.DataSharingSettingsV2]);
