import React from 'react';
import { makeStyles } from '@rbx/ui';
import useLabelStyles from './Label.styles';

const useStyles = makeStyles()((theme) => ({
  root: {
    alignItems: 'center',
    display: 'flex',
    gap: 4,
    padding: 8,
    width: 'max-content',
    ...theme.border.radius.xsmall,
  },
}));

export type sizes = 'default' | 'large';
export type variants = 'default' | 'error' | 'success' | 'warning';

/**
 * A compact component for displaying simple status indicators with an icon and short text.
 *
 * This component is designed for concise, single-line status indicators that show the current
 * state of something. It's typically used for:
 * - Approval statuses
 * - Simple state indicators
 * - Compact status badges
 * - Quick visual status feedback
 *
 */
const StatusLabel = ({
  icon,
  text,
  size = 'default',
  variant = 'default',
  pill = false,
}: {
  icon: React.ReactNode | undefined;
  text: string | undefined;
  size?: sizes;
  variant?: variants;
  /** Render with fully rounded (pill) ends instead of the default boxy corners. */
  pill?: boolean;
}) => {
  const { classes, cx } = useStyles();
  const { classes: labelClasses } = useLabelStyles();

  const sizeToStyle: { [key in sizes]: string } = {
    default: labelClasses.defaultTextSize,
    large: labelClasses.largeTextSize,
  };

  const variantToStyle: {
    [key in variants]: string;
  } = {
    default: labelClasses.defaultBackgroundColor,
    error: labelClasses.error,
    warning: labelClasses.warning,
    success: labelClasses.success,
  };

  const textSize = sizeToStyle[size];
  const styling = variantToStyle[variant];
  return (
    <div className={cx(classes.root, styling, textSize, pill && '!radius-circle')}>
      {icon}
      <div>{text}</div>
    </div>
  );
};

export default StatusLabel;
