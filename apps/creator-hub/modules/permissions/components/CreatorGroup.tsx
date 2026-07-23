import React, { FunctionComponent } from 'react';
import { Grid, InfoOutlinedIcon, makeStyles, Tooltip, Typography } from '@rbx/ui';
import { CreatorDetails, CreatorGroupDetails } from '../utils/types';
import { Creator } from './Creator';
import { useTranslationContext } from '../providers/TranslationProvider';

type CreatorsGroupProps = CreatorGroupDetails & {
  selectedCreator?: CreatorDetails;
  onCreatorSelect: (creator: CreatorDetails) => void;
};

const useCreatorGroupStyles = makeStyles()({
  creatorGroupList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
});

const CreatorsGroup: FunctionComponent<CreatorsGroupProps> = ({
  type,
  creatorsList,
  selectedCreator,
  onCreatorSelect,
}) => {
  const {
    classes: { creatorGroupList },
  } = useCreatorGroupStyles();
  const { translate } = useTranslationContext();

  const creatorGroupTitle = translate(`CreatorGroup.${type}.Title`);
  const creatorGroupInfo = translate(`CreatorGroup.${type}.Info`);

  return (
    <Grid>
      {creatorGroupTitle && (
        <Grid container mb={1} mt={3}>
          <Grid item marginRight={1}>
            <Typography variant='h6'>{creatorGroupTitle}</Typography>
          </Grid>
          <Grid item>
            {creatorGroupInfo && (
              <Tooltip
                arrow
                title={creatorGroupInfo}
                placement='right'
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <InfoOutlinedIcon fontSize='small' />
              </Tooltip>
            )}
          </Grid>
        </Grid>
      )}
      <ul className={creatorGroupList}>
        {creatorsList &&
          creatorsList.map((creator) => (
            <li key={creator.id}>
              <Creator
                {...creator}
                selected={
                  selectedCreator?.id === creator.id && selectedCreator?.type === creator.type
                }
                onCreatorSelect={onCreatorSelect}
              />
            </li>
          ))}
      </ul>
    </Grid>
  );
};

export { CreatorsGroup, type CreatorsGroupProps };
