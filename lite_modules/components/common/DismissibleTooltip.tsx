import {
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipFullWidthFooter,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
  Link,
} from '@rbx/foundation-ui';
import { cloneElement, useCallback, useState } from 'react';

import { TooltipConfiguration } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTooltipSelectionSlot from '@hooks/useTooltipSelectionSlot';
import { LinkTag } from '@type/translation';
import { GetLocalStorage, SetLocalStorage } from '@utils/localStorage';

interface DismissibleTooltipProps {
  /** The element the tooltip anchors to. Must be a single React element (Radix `asChild` slot). */
  anchorElement: React.ReactElement;
  /**
   * Whether the tooltip is allowed to render at all. When false, the tooltip is forced closed
   * regardless of the localStorage flag (the dismissal state is preserved). Useful for suppressing
   * the tooltip while the surrounding context is not ready (e.g. nav rail collapsed).
   * Defaults to true.
   */
  /**
   * When true, clicking the anchor element dismisses the tooltip (in addition to the footer
   * action). Use for coachmarks that point at an actionable element — e.g. the Asset Library
   * nav item or the Generate AI button — so taking the action also retires the education.
   * The anchor's own `onClick` still fires. Defaults to false.
   */
  dismissOnAnchorClick?: boolean;
  enabled?: boolean;
  /**
   * The static definition of the tooltip — storage key, priority, copy keys, and presentation
   * defaults. Pick a member of `Tooltips` from `@constants/tooltips`. Everything that is
   * identity-level about the tooltip (what it says, where it points, what it persists under)
   * lives there; the component only takes the things that vary per render: where the tooltip
   * anchors in the JSX tree and whether the surrounding context is ready for it to appear.
   */
  tooltip: TooltipConfiguration;
}

const DismissibleTooltip = ({
  anchorElement,
  dismissOnAnchorClick = false,
  enabled = true,
  tooltip,
}: DismissibleTooltipProps) => {
  const {
    closeLabelKey,
    closeLabelNamespace,
    descriptionKey,
    descriptionLinkUrl,
    dismissOnOutsideInteraction,
    headingKey,
    namespace,
    position,
    priority,
    storageKey,
  } = tooltip;
  const { translate, translateHTML } = useNamespacedTranslation(namespace);
  const { translate: translateCloseLabel } = useNamespacedTranslation(closeLabelNamespace);

  const [isOpen, setIsOpen] = useState<boolean>(() => !GetLocalStorage(storageKey));

  const isActiveTooltip = useTooltipSelectionSlot({
    id: storageKey,
    priority,
    wantsToShow: isOpen && enabled,
  });

  const dismiss = useCallback(() => {
    SetLocalStorage(storageKey, true);
    setIsOpen(false);
  }, [storageKey]);

  // When `dismissOnAnchorClick` is set, the coachmark points at an actionable
  // element (e.g. the Asset Library nav item or the Generate AI button), so
  // taking that action should also retire the education. Wrap the anchor's
  // existing `onClick` so it still runs before we dismiss.
  const clickableAnchor = anchorElement as React.ReactElement<{
    onClick?: (event: React.MouseEvent) => void;
  }>;
  const trigger = dismissOnAnchorClick
    ? cloneElement(clickableAnchor, {
        onClick: (event: React.MouseEvent) => {
          clickableAnchor.props.onClick?.(event);
          dismiss();
        },
      })
    : anchorElement;

  // When the tooltip declares a `descriptionLinkUrl`, wire up the
  // `{aStart}…{aEnd}` placeholder pair to wrap its inner text in an external
  // link.
  const descriptionTags: LinkTag[] | undefined =
    descriptionLinkUrl === undefined
      ? undefined
      : [
          {
            closing: 'aEnd',
            content: (chunks) => (
              <Link
                href={descriptionLinkUrl}
                isExternal={false}
                rel='noopener noreferrer'
                target='_blank'>
                {chunks}
              </Link>
            ),
            opening: 'aStart',
          },
        ];

  return (
    <EducationalTooltip
      onOpenChange={(open) => {
        if (!open && isOpen && dismissOnOutsideInteraction) {
          dismiss();
        }
      }}
      open={isOpen && enabled && isActiveTooltip}>
      <EducationalTooltipTrigger asChild>{trigger}</EducationalTooltipTrigger>
      <EducationalTooltipContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        position={position}>
        <EducationalTooltipBody>
          <EducationalTooltipTitle>{translate(headingKey)}</EducationalTooltipTitle>
          <EducationalTooltipDescription>
            {translateHTML(descriptionKey, descriptionTags)}
          </EducationalTooltipDescription>
        </EducationalTooltipBody>
        <EducationalTooltipFullWidthFooter
          primaryAction={{ label: translateCloseLabel(closeLabelKey), onClick: dismiss }}
        />
      </EducationalTooltipContent>
    </EducationalTooltip>
  );
};

export default DismissibleTooltip;
