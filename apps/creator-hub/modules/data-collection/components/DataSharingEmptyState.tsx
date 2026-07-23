import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link, Typography, makeStyles } from '@rbx/ui';
import type { TEmptyState } from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import DataSharingTabKey from '../enums/DataSharingTabKey';

const useStyles = makeStyles()((theme) => ({
  withBorder: {
    ...theme.border.radius.medium,
    border: `1px solid ${theme.palette.components.divider}`,
    marginTop: theme.spacing(2),
  },
}));

interface DataSharingEmptyStateProps {
  tab: DataSharingTabKey;
}

type IllustrationType = TEmptyState['illustration'];

interface EmptyStateFieldsForTab {
  title: string;
  illustration: IllustrationType;
  description?: React.ReactNode;
}

const DataSharingEmptyState: FC<DataSharingEmptyStateProps> = ({ tab }) => {
  const {
    classes: { withBorder },
  } = useStyles();
  const { translate, translateHTML } = useTranslation();

  const translateWithLink = useCallback(
    (key: string, url: string) => {
      return translateHTML(key, [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return <Link href={url}>{chunks}</Link>;
          },
        },
      ]);
    },
    [translateHTML],
  );

  const fieldsForTab: Record<DataSharingTabKey, EmptyStateFieldsForTab> = useMemo(() => {
    const experienceDescription = (
      <Typography variant='body2'>
        {translateWithLink('Message.ExperiencesEmpty', docs.getExperiencesPublishingUrl())}
      </Typography>
    );
    return {
      [DataSharingTabKey.ExperienceSettings]: {
        title: translate('Header.ExperiencesEmpty'),
        illustration: 'experiences',
        description: experienceDescription,
      },
      [DataSharingTabKey.LuauDataset]: {
        title: translate('Header.ExperiencesEmpty'),
        illustration: 'experiences',
        description: experienceDescription,
      },
      [DataSharingTabKey.AvatarItems]: {
        title: translate('Header.BundlesEmpty'),
        illustration: 'avatarItem',
        description: (
          <Typography variant='body2'>
            {translateWithLink('Message.BundlesEmpty', docs.getAvatarItemsUrl())}
          </Typography>
        ),
      },
      [DataSharingTabKey.CreatorStoreAssets]: {
        title: translate('Header.ProductsEmpty'),
        illustration: 'creatorStore',
        description: (
          <Typography variant='body2'>
            {translateWithLink('Message.ProductsEmpty', docs.getSellingOnCreatorStoreUrl())}
          </Typography>
        ),
      },
    };
  }, [translate, translateWithLink]);

  const { title, illustration, description } = fieldsForTab[tab];
  return (
    <Flex classes={{ root: withBorder }}>
      <EmptyState
        title={title}
        illustration={illustration}
        description={description}
        size='small'
      />
    </Flex>
  );
};

export default withTranslation(DataSharingEmptyState, [TranslationNamespace.DataSharingSettingsV2]);
