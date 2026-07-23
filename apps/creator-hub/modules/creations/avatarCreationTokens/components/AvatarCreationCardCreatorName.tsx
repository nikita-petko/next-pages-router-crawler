import React, { FunctionComponent, useMemo } from 'react';
import { Skeleton, Link, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

export interface AvatarCreationCardCreatorNameProps {
  creatorUserId: number;
  creatorName: string;
  isLoading: boolean;
}

const AvatarCreationCardCreatorName: FunctionComponent<
  React.PropsWithChildren<AvatarCreationCardCreatorNameProps>
> = ({ creatorUserId, creatorName, isLoading }) => {
  const { translateHTML } = useTranslation();

  const getProfileUrl = useMemo(() => {
    return new URL(`/users/${creatorUserId}/profile`, `https://${process.env.robloxSiteDomain}`)
      .href;
  }, [creatorUserId]);

  return (
    <Typography variant='body2' color='secondary' noWrap>
      {translateHTML(
        'Label.AvatarCreationsCreatorName',
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <React.Fragment>
                  &nbsp;
                  <Link href={getProfileUrl} target='_blank' color='inherit'>
                    {chunks}
                  </Link>
                </React.Fragment>
              );
            },
          },
        ],
        {
          creatorName: isLoading ? <Skeleton /> : <span>{creatorName}</span>,
        },
      )}
    </Typography>
  );
};

export default AvatarCreationCardCreatorName;
