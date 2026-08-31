import type { FC, MouseEventHandler } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';

const OverflowingTabIndex = 0;
const NativeFocusableTags: ReadonlySet<string> = new Set(['a']);
const TruncatedTitleClassName = 'text-no-wrap text-truncate-end min-width-0 max-width-full';
const FocusableTruncatedTitleClassName = `${TruncatedTitleClassName} focus-visible:outline-focus`;

type OverflowTitleCommonProps = {
  readonly text: string;
  readonly className?: string;
};

export type OverflowTitleProps =
  | (OverflowTitleCommonProps & {
      readonly as?: 'span' | 'h1';
    })
  | (OverflowTitleCommonProps & {
      readonly as: 'a';
      readonly href: string;
      readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
    });

function mergeClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter((value) => value !== undefined && value.length > 0).join(' ');
}

/**
 * Truncating title that shows an accessible tooltip of the full text only when
 * the label is actually overflowing. Hover and keyboard focus both open it.
 */
const OverflowTitle: FC<OverflowTitleProps> = (props) => {
  const { text, className } = props;
  const as = props.as ?? 'span';
  const href = props.as === 'a' ? props.href : undefined;
  const onClick = props.as === 'a' ? props.onClick : undefined;
  const labelRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const measureOverflow = useCallback((element: HTMLElement) => {
    const nextIsOverflowing = element.scrollWidth > element.clientWidth;
    setIsOverflowing((current) => (current === nextIsOverflowing ? current : nextIsOverflowing));
  }, []);

  const setLabelRef = useCallback(
    (element: HTMLElement | null) => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      labelRef.current = element;
      if (!element) {
        return;
      }

      measureOverflow(element);
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => measureOverflow(element));
        observer.observe(element);
        resizeObserverRef.current = observer;
      }
    },
    [measureOverflow],
  );

  useEffect(() => {
    const element = labelRef.current;
    if (element) {
      measureOverflow(element);
    }
  }, [measureOverflow, text]);

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const isNativeFocusable = NativeFocusableTags.has(as);
  const tabIndex = isOverflowing && !isNativeFocusable ? OverflowingTabIndex : undefined;
  const displayClassName = as === 'span' ? 'block' : undefined;
  const mergedClassName = mergeClassNames(
    isOverflowing && !isNativeFocusable
      ? FocusableTruncatedTitleClassName
      : TruncatedTitleClassName,
    displayClassName,
    className,
  );

  const titleElement =
    as === 'a' ? (
      <a
        ref={setLabelRef}
        className={mergedClassName}
        href={href}
        tabIndex={tabIndex}
        onClick={onClick}>
        <bdi>{text}</bdi>
      </a>
    ) : as === 'h1' ? (
      <h1 ref={setLabelRef} className={mergedClassName} tabIndex={tabIndex}>
        <bdi>{text}</bdi>
      </h1>
    ) : (
      <span ref={setLabelRef} className={mergedClassName} tabIndex={tabIndex}>
        <bdi>{text}</bdi>
      </span>
    );

  if (!isOverflowing) {
    return titleElement;
  }

  return (
    <Tooltip title={text} position='top-center'>
      <TooltipTrigger asChild>{titleElement}</TooltipTrigger>
    </Tooltip>
  );
};

export default OverflowTitle;
