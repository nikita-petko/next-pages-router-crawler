import { Typography } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import { getPrettifiedNumber } from '@rbx/core';

type UpdatesMetadataRowClasses = {
  row: string;
  item: string;
  icon: string;
  text: string;
  tagText?: string;
  tagsRow?: string;
};

type UpdatesMetadataRowProps = {
  likeCount?: number | null;
  postsCount?: number | null;
  tags?: string[];
  classes: UpdatesMetadataRowClasses;
};

const UpdatesMetadataRow = ({ likeCount, postsCount, tags, classes }: UpdatesMetadataRowProps) => {
  const tagList = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const tagClass = classes.tagText ?? classes.text;

  const tagElements = tagList.map((tag) => (
    <Typography key={tag} variant='body2' classes={{ root: tagClass }}>
      {tag}
    </Typography>
  ));

  const tagString = tagList.join('  ');

  return (
    <div className={classes.row}>
      <div className={classes.item}>
        <Icon name='icon-regular-heart' size='XSmall' className={classes.icon} />
        <Typography variant='body2' classes={{ root: classes.text }}>
          {getPrettifiedNumber(likeCount ?? 0)}
        </Typography>
      </div>
      <div className={classes.item}>
        <Icon name='icon-regular-speech-bubble-align-left' size='XSmall' className={classes.icon} />
        <Typography variant='body2' classes={{ root: classes.text }}>
          {getPrettifiedNumber(postsCount ?? 0)}
        </Typography>
      </div>
      {tagList.length > 0 &&
        (classes.tagsRow ? (
          <div className={classes.tagsRow}>
            <Typography variant='body2' classes={{ root: tagClass }}>
              {tagString}
            </Typography>
          </div>
        ) : (
          tagElements
        ))}
    </div>
  );
};

export default UpdatesMetadataRow;
