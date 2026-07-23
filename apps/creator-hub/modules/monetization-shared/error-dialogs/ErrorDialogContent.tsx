import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';

type TitleProps =
  | { titleKey: string; title?: never }
  | { title: React.ReactNode; titleKey?: never };

type BodyProps = { bodyKey: string; body?: never } | { body: React.ReactNode; bodyKey?: never };

type ActionProps =
  | { actionKey?: string; action?: never }
  | { action: React.ReactNode; actionKey?: never };

type BaseProps = {
  onClose: () => void;
};

export type ErrorDialogContentProps = BaseProps & TitleProps & BodyProps & ActionProps;

/**
 * Content-agnostic error dialog body.
 *
 * Each slot accepts either a translation key (resolved with `translate(...)`) or a React node
 * (rendered as-is). For dynamic strings (interpolation, pluralization, link injection, etc.)
 * pass a node from the caller — keep this component free of message-shaping logic.
 *
 * @example
 * ```tsx
 * <ErrorDialogContent
 *   titleKey='Heading.ErrorOccurred'
 *   bodyKey='Message.ErrorProcessingRequest'
 *   actionKey='Action.Continue'
 *   onClose={closeDialog}
 * />
 * ```
 *
 * @example With a custom body node (e.g. pluralization)
 * ```tsx
 * <ErrorDialogContent
 *   titleKey='Heading.ErrorOccurred'
 *   body={<PartialFailuresBody count={count} />}
 *   actionKey='Action.Continue'
 *   onClose={closeDialog}
 * />
 * ```
 */
function ErrorDialogContent({
  titleKey,
  title,
  bodyKey,
  body,
  actionKey,
  action,
  onClose,
}: ErrorDialogContentProps) {
  const { translate } = useTranslation();

  const titleNode = titleKey !== undefined ? translate(titleKey) : title;
  const bodyNode = bodyKey !== undefined ? translate(bodyKey) : body;
  const actionNode =
    actionKey !== undefined ? (
      <Button variant='Emphasis' size='Medium' className='fill small:grow-0' onClick={onClose}>
        {translate(actionKey)}
      </Button>
    ) : (
      action
    );

  return (
    <DialogContent className='width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-small'>
          {titleNode}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none'>{bodyNode}</span>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
        {actionNode}
      </DialogFooter>
    </DialogContent>
  );
}

export default withTranslation(ErrorDialogContent, [TranslationNamespace.Creations]);
