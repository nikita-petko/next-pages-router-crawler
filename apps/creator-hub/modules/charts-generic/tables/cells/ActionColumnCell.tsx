import React, { useMemo } from 'react';
import {
  Tooltip,
  IconButton,
  useMediaQuery,
  TTableCellProps,
  Button,
  TIconButtonProps,
  CircularProgress,
} from '@rbx/ui';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { Link } from '@modules/miscellaneous/common';
import { ActionCellType, TableActionColors, ActionCellAction } from '../types/GenericTableType';
import OptionMenu from '../OptionMenu';
import cellAlignmentToJustifyContent from './cellAlignmentToJustifyContent';

type ActionColumnCellProps<TActionType extends string, TActionOn = string> = {
  cellValue: ActionCellType<TActionType, TActionOn>;
  align?: TTableCellProps['align'];
  isRowSelected?: boolean;
};

const ActionColumnCell = <TActionType extends string, TActionOn>({
  cellValue,
  align = 'inherit',
  isRowSelected = false,
}: ActionColumnCellProps<TActionType, TActionOn>) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { actions } = cellValue;
  const { dedicatedActions, menuOptions } = useMemo(() => {
    const dedicated: Array<
      ActionCellAction<TActionType, TActionOn> & {
        renderedAsInNonCompactTable: 'dedicated-button';
      }
    > = [];
    const menu: Array<ActionCellAction<TActionType, TActionOn>> = [];

    actions.forEach((action) => {
      // In compact mode, everything goes to menu, otherwise just explicit 'menu-only' actions
      if (isCompactView) {
        menu.push(action);
        return;
      }

      const { renderedAsInNonCompactTable: viewAs } = action;

      switch (viewAs) {
        case 'dedicated-button':
          dedicated.push(action);
          break;
        case 'menu-item':
          menu.push(action);
          break;
        default: {
          const exhaustiveCheck: never = viewAs;
          throw new Error(`Invalid renderAs: ${exhaustiveCheck}`);
        }
      }
    });

    return {
      dedicatedActions: dedicated,
      menuOptions: menu,
    };
  }, [actions, isCompactView]);

  const optionMenu = useMemo(() => {
    if (!menuOptions.length) {
      return null;
    }
    const onSelected = (option: ActionCellAction<TActionType, TActionOn>) => {
      menuOptions
        .find(({ actionType }) => actionType === option.actionType)
        ?.onActionInvoked?.(option.actionOn);
    };
    return <OptionMenu options={menuOptions} onSelected={onSelected} />;
  }, [menuOptions]);

  if (isCompactView) {
    return optionMenu;
  }

  return (
    <div
      style={{
        display: 'flex',
        columnGap: '6px',
        justifyContent: cellAlignmentToJustifyContent(align),
        transition: 'opacity 0.2s ease-in-out',
      }}>
      {dedicatedActions.map(
        ({
          tooltipLabel,
          color,
          onActionInvoked,
          Icon,
          disabled,
          loading,
          displayLabel,
          actionType,
          actionOn,
          href,
          alwaysVisible,
        }) => {
          const isDisabled = disabled || loading;

          const sx: TIconButtonProps['sx'] = (theme) => {
            const validColor =
              color && isValidArrayEnumValue(TableActionColors, color) ? color : 'secondary';
            return {
              whiteSpace: 'nowrap',
              '&:hover': {
                color: theme.palette[validColor].main,
              },
            };
          };

          const onClick = href ? undefined : () => onActionInvoked(actionOn);

          const buttonElement = Icon ? (
            <IconButton
              onClick={onClick}
              disabled={isDisabled}
              size='medium'
              color='secondary'
              sx={sx}
              aria-label={displayLabel}
              aria-busy={loading}
              data-testid='action-icon-button'>
              {loading ? <CircularProgress size={20} color='inherit' /> : <Icon />}
            </IconButton>
          ) : (
            <Button
              variant='contained'
              color='secondary'
              size='small'
              sx={sx}
              onClick={onClick}
              disabled={isDisabled}
              loading={loading}>
              {displayLabel}
            </Button>
          );

          const wrappedButton =
            href && !isDisabled ? (
              <Link href={href} underline='none' onClick={() => onActionInvoked(actionOn)}>
                {buttonElement}
              </Link>
            ) : (
              buttonElement
            );

          const actionWrapperClass =
            alwaysVisible || isRowSelected ? 'action-icons' : 'action-icons hover-hide';

          return (
            <Tooltip title={tooltipLabel ?? displayLabel} key={actionType} placement='bottom' arrow>
              <span className={actionWrapperClass}>{wrappedButton}</span>
            </Tooltip>
          );
        },
      )}
      {optionMenu}
    </div>
  );
};
export default ActionColumnCell;
