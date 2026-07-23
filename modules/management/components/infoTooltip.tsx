import { InfoOutlinedIcon, Tooltip } from '@rbx/ui';

import { TODOFIXANY } from 'app/shared/types';

interface InfoTooltipProps {
  classesToAdd?: TODOFIXANY;
  disableHoverListener?: boolean;
  text: string;
}

const InfoTooltip = ({
  classesToAdd = {},
  disableHoverListener = false,
  text,
}: InfoTooltipProps) => (
  <Tooltip arrow disableHoverListener={disableHoverListener} placement='bottom' title={text}>
    <InfoOutlinedIcon classes={classesToAdd} fontSize='small' />
  </Tooltip>
);

export { InfoTooltip };
