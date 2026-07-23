import { CueCallout, CueProvider } from '@rbx/cueing/react';
import {
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipFullWidthFooter,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
} from '@rbx/foundation-ui';
import { ReactElement } from 'react';

import type { CueModalId } from '@constants/cueModalIds';
import type { TooltipConfiguration } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import type { CueDismissHandler } from '@type/cueing';

type CueEducationalCalloutProps = {
  anchorElement: ReactElement;
  dismissHandler?: CueDismissHandler;
  enabled?: boolean;
  modalId: CueModalId;
  tooltip: Pick<
    TooltipConfiguration,
    | 'closeLabelKey'
    | 'closeLabelNamespace'
    | 'descriptionKey'
    | 'headingKey'
    | 'namespace'
    | 'position'
  >;
};

const CueEducationalCallout = ({
  anchorElement,
  dismissHandler,
  enabled = true,
  modalId,
  tooltip: { closeLabelKey, closeLabelNamespace, descriptionKey, headingKey, namespace, position },
}: CueEducationalCalloutProps) => {
  const { translate } = useNamespacedTranslation(namespace);
  const { translate: translateCloseLabel } = useNamespacedTranslation(closeLabelNamespace);

  if (!enabled) {
    return anchorElement;
  }

  return (
    <CueProvider modalId={modalId}>
      <CueCallout>
        {(state) => {
          if (!state.isActive) {
            return anchorElement;
          }

          const dismiss = () => {
            if (dismissHandler && !dismissHandler.prepareDismiss()) {
              return;
            }
            // Browser storage must succeed before Modal History POST via state.dismiss().
            state.dismiss();
          };

          return (
            <EducationalTooltip onOpenChange={() => undefined} open>
              <EducationalTooltipTrigger asChild>{anchorElement}</EducationalTooltipTrigger>
              <EducationalTooltipContent
                onOpenAutoFocus={(event) => event.preventDefault()}
                position={position}>
                <EducationalTooltipBody>
                  <EducationalTooltipTitle>{translate(headingKey)}</EducationalTooltipTitle>
                  <EducationalTooltipDescription>
                    {translate(descriptionKey)}
                  </EducationalTooltipDescription>
                </EducationalTooltipBody>
                <EducationalTooltipFullWidthFooter
                  primaryAction={{
                    label: translateCloseLabel(closeLabelKey),
                    onClick: dismiss,
                  }}
                />
              </EducationalTooltipContent>
            </EducationalTooltip>
          );
        }}
      </CueCallout>
    </CueProvider>
  );
};

export default CueEducationalCallout;
