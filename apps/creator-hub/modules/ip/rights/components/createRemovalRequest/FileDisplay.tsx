import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import React, { FunctionComponent, useState } from 'react';
import { Button, Grid, Tooltip, Typography } from '@rbx/ui';

interface FileDisplayProps {
  docs: Doc[];
}

const FileDisplay: FunctionComponent<React.PropsWithChildren<FileDisplayProps>> = ({ docs }) => {
  const [expandFiles, setExpandFiles] = useState(false);

  if (!docs || docs.length === 0) {
    return <Typography variant='body2'>-</Typography>;
  }

  if (!expandFiles) {
    const decodedFirstFileName = decodeURI(docs[0].name);
    return (
      <Grid container direction='column' XSmall zeroMinWidth flexWrap='nowrap'>
        <Tooltip arrow placement='left' title={decodedFirstFileName} key={docs[0].key}>
          <Typography variant='body2' noWrap>
            {decodedFirstFileName}
          </Typography>
        </Tooltip>
        {docs.length > 1 && (
          <Grid item>
            <Button
              sx={{ textTransform: 'none', left: -5 }}
              size='small'
              onClick={() => setExpandFiles(true)}>
              {`and ${docs.length - 1} more`}
            </Button>
          </Grid>
        )}
      </Grid>
    );
  }

  return (
    <Grid container direction='column' XSmall zeroMinWidth flexWrap='nowrap'>
      {docs.map((doc) => {
        const decodedFileName = decodeURI(doc.name);
        return (
          <Tooltip arrow placement='left' title={decodedFileName} key={doc.key}>
            <Typography variant='body2' noWrap>
              {decodedFileName}
            </Typography>
          </Tooltip>
        );
      })}
    </Grid>
  );
};

export default FileDisplay;
