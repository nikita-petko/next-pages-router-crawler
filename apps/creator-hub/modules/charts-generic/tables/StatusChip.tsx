import type { FC } from 'react';
import { useMemo } from 'react';
import { Badge } from '@rbx/foundation-ui';
import {
  BlockIcon,
  CheckCircleOutlineIcon,
  ErrorOutlineOutlinedIcon,
  makeStyles,
  ScheduleIcon,
  Typography,
  useTheme,
} from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import type { TDotStatus, TIconStatus, TStatus } from './types/GenericTableType';
import { Status } from './types/GenericTableType';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'inline-flex',
    backgroundColor: theme.palette.surface[300],
    padding: '6px',
    ...theme.border.radius.small,
  },
}));

type IconStatusChipProps = { status: TIconStatus };
const IconStatusChip: FC<IconStatusChipProps> = ({ status }) => {
  const {
    classes: { root },
  } = useStyles();
  const { preset, label } = status;

  const icon = useMemo(() => {
    switch (preset) {
      case Status.Success:
        return <CheckCircleOutlineIcon color='success' fontSize='small' />;
      case Status.Warning:
        return <ScheduleIcon color='warning' fontSize='small' />;
      case Status.Error:
        return <ErrorOutlineOutlinedIcon color='error' fontSize='small' />;
      case Status.Disabled:
        return <BlockIcon color='disabled' fontSize='small' />;
      default: {
        const exhaustiveCheck: never = preset;
        throw new Error(`Unhandled preset: ${JSON.stringify(exhaustiveCheck)}`);
      }
    }
  }, [preset]);

  return (
    <Flex alignItems='center' gap={4} classes={{ root }}>
      {icon}
      <Typography variant='chip'>{label}</Typography>
    </Flex>
  );
};

type DotStatusChipProps = { status: TDotStatus };
const DotStatusChip: FC<DotStatusChipProps> = ({ status }) => {
  const {
    classes: { root },
  } = useStyles();
  const { color: themeColor, label } = status;
  const theme = useTheme();
  const dotColor = useMemo(() => theme.palette[themeColor].main, [themeColor, theme.palette]);
  return (
    <Flex alignItems='center' gap={6} classes={{ root }}>
      <div style={{ backgroundColor: dotColor, width: 8, height: 8, borderRadius: '50%' }} />
      <Typography variant='chip'>{label}</Typography>
    </Flex>
  );
};

type StatusChipProps = { status: TStatus };
const StatusChip: FC<StatusChipProps> = ({ status }) => {
  const { chipType } = status;
  switch (chipType) {
    case 'icon':
      return <IconStatusChip status={status} />;
    case 'dot':
      return <DotStatusChip status={status} />;
    case 'badge': {
      const { variant, label, icon } = status;
      return <Badge variant={variant} label={label} icon={icon} />;
    }
    default: {
      const exhaustiveCheck: never = chipType;
      throw new Error(`Unhandled status chipType: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};

export default StatusChip;
