import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  FeedbackBanner,
  Icon,
  Radio,
  RadioGroup,
  TextInput,
  clsx,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useListApplications } from '../../hooks/useApplications';
import { useCloseJob } from '../../hooks/useJobMutations';
import dialogStyles from '../shared/Layout.module.css';

type CloseJobDialogProps = {
  open: boolean;
  jobId?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

// Matches the backend JobCloseReason enum (1–4).
type ReasonCode = '1' | '2' | '3' | '4';
const REASON_CODE_TO_NUMBER: Record<ReasonCode, 1 | 2 | 3 | 4> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
};

type ApplicantOption = { id: string; label: string; userId?: number };

type ApplicantSearchSelectProps = {
  options: ApplicantOption[];
  value: string;
  onChange: (id: string) => void;
};

/**
 * Minimal combobox-style applicant picker. There's no Autocomplete primitive
 * in foundation-ui, so we layer a plain TextInput with a filtered result list
 * that appears on focus / query entry. Selecting a row pushes the name into
 * the input and returns the id upstream.
 */
const ApplicantSearchSelect: React.FC<ApplicantSearchSelectProps> = ({
  options,
  value,
  onChange,
}) => {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const v = translate(key);
      return v && v !== key ? v : fallback;
    },
    [translate],
  );
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Keep the input text in sync with the externally-selected option so
  // re-opening the dialog doesn't show stale query text.
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);
  useEffect(() => {
    if (selected && query === '') {
      setQuery(selected.label);
    }
  }, [selected, query]);

  // Close the popover when focus leaves the combobox container.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (selected && q === selected.label.toLowerCase())) {
      return options;
    }
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, selected]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setIsOpen(true);
      // Clear the upstream selection if the user is actively editing away from
      // the previously selected label.
      if (value) {
        onChange('');
      }
    },
    [value, onChange],
  );

  const handleSelect = useCallback(
    (opt: ApplicantOption) => {
      onChange(opt.id);
      setQuery(opt.label);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => setIsOpen(true), []);
  const handleClear = useCallback(() => {
    onChange('');
    setQuery('');
    setIsOpen(true);
  }, [onChange]);

  return (
    <div ref={rootRef} className={dialogStyles.applicantSearchRoot}>
      <TextInput
        size='Medium'
        placeholder={tr('Label.SelectApplicant', 'Select applicant')}
        value={query}
        onChange={handleQueryChange}
        onFocus={handleFocus}
        aria-label={tr('Aria.SearchApplicantsHiredViaTalentHub', 'Search applicants')}
        aria-autocomplete='list'
        aria-expanded={isOpen}
        trailingIconNode={
          value ? (
            <button
              type='button'
              onClick={handleClear}
              aria-label={tr('Aria.ClearApplicantSelection', 'Clear selection')}
              className={dialogStyles.buttonReset}>
              <Icon name='icon-regular-x' size='XSmall' />
            </button>
          ) : (
            <Icon name='icon-regular-chevron-large-down' size='XSmall' />
          )
        }
      />
      {isOpen && (
        <div className={dialogStyles.applicantSearchMenu} role='listbox'>
          {filtered.length === 0 ? (
            <div className='padding-small content-muted text-body-small'>
              {tr('Empty.NoApplicantsMatch', 'No applicants match')}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.id}
                type='button'
                role='option'
                aria-selected={opt.id === value}
                className={clsx(
                  dialogStyles.applicantSearchOption,
                  opt.id === value && dialogStyles.applicantSearchOptionSelected,
                )}
                onClick={() => handleSelect(opt)}>
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const CloseJobDialog: React.FC<CloseJobDialogProps> = ({
  open,
  jobId,
  onClose,
  onConfirm,
}) => {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const v = translate(key);
      return v && v !== key ? v : fallback;
    },
    [translate],
  );
  const reasons = useMemo(
    () => [
      {
        value: '1' as const,
        label: tr('CloseReason.HiredViaTalentHub', 'We hired someone we found on Talent Hub.'),
      },
      {
        value: '2' as const,
        label: tr(
          'CloseReason.HiredViaOtherSite',
          'We hired someone we found on a different site.',
        ),
      },
      {
        value: '3' as const,
        label: tr(
          'CloseReason.NoLongerHiring',
          'We are no longer interested in hiring for this position.',
        ),
      },
      { value: '4' as const, label: tr('CloseReason.OtherSpecify', 'Other (please specify)') },
    ],
    [tr],
  );
  const closeJob = useCloseJob(jobId);
  const [reason, setReason] = useState<ReasonCode>('1');
  const [hiredApplicantId, setHiredApplicantId] = useState<string>('');
  const [otherText, setOtherText] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Only fetch applicants when we actually need them (reason 1 selected + dialog open).
  const shouldFetchApplicants = open && reason === '1' && !!jobId;
  const { data: applicationsData } = useListApplications(shouldFetchApplicants ? { jobId } : {});
  const applicantOptions = useMemo<ApplicantOption[]>(
    () =>
      (applicationsData?.items ?? [])
        .filter((a): a is typeof a & { id: string } => Boolean(a.id))
        .map((a) => ({
          id: a.id,
          label: a.talentName || `Applicant #${a.id.slice(0, 6)}`,
          userId: a.talentUserId ?? undefined,
        })),
    [applicationsData],
  );

  const hiredApplicant = useMemo(
    () => applicantOptions.find((a) => a.id === hiredApplicantId),
    [applicantOptions, hiredApplicantId],
  );

  // Gate the Close button: if "hired via TH" is the reason, require a selected
  // applicant. If "Other", require at least some free-text explanation.
  const isConfirmDisabled =
    (reason === '1' && !hiredApplicantId) || (reason === '4' && !otherText.trim());

  const handleConfirm = useCallback(async () => {
    if (!jobId || isConfirmDisabled) {
      return;
    }
    setIsClosing(true);
    setCloseError(null);

    const reasonCode = REASON_CODE_TO_NUMBER[reason];
    const hiredUserId = hiredApplicant?.userId ?? undefined;

    try {
      await closeJob.mutateAsync({
        reason: reasonCode,
        otherText: reason === '4' ? otherText.trim() : null,
        hiredUserId: reason === '1' ? (hiredUserId ?? null) : null,
      });
    } catch {
      setCloseError(tr('Error.FailedToCloseJob', 'Failed to close job.'));
      setIsClosing(false);
      return;
    }
    setIsClosing(false);
    onConfirm?.();
    onClose();
  }, [
    jobId,
    reason,
    otherText,
    hiredApplicant,
    isConfirmDisabled,
    closeJob,
    onConfirm,
    onClose,
    tr,
  ]);

  const handleReasonChange = useCallback((next: string) => {
    setReason(next as ReasonCode);
    if (next !== '1') {
      setHiredApplicantId('');
    }
    if (next !== '4') {
      setOtherText('');
    }
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <div className='flex flex-col gap-medium padding-large'>
          <div className='text-heading-medium'>{tr('Heading.CloseJobPost', 'Close job post')}</div>
          <div className='text-body-medium content-muted'>
            {tr(
              'Description.CloseJobExplanation',
              'This job will be removed from the job listings on Talent Hub, and creators will no longer be able to apply.',
            )}
          </div>

          <div className='text-title-small'>
            {tr('Label.CloseReasonPrompt', 'Select the reason for closing:')}
          </div>

          <RadioGroup value={reason} onValueChange={handleReasonChange} size='Small'>
            <div className='flex flex-col gap-medium'>
              {reasons.map((r) => (
                <React.Fragment key={r.value}>
                  <Radio value={r.value} label={r.label} />
                  {r.value === '1' && reason === '1' ? (
                    <div className={dialogStyles.radioSubField}>
                      <ApplicantSearchSelect
                        options={applicantOptions}
                        value={hiredApplicantId}
                        onChange={setHiredApplicantId}
                      />
                    </div>
                  ) : null}
                  {r.value === '4' && reason === '4' ? (
                    <div className={dialogStyles.radioSubField}>
                      <TextInput
                        size='Medium'
                        placeholder={tr(
                          'Description.OtherCloseReasonPlaceholder',
                          'Please share the reason.',
                        )}
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        aria-label={tr('Label.CloseReasonDetail', 'Reason for closing')}
                      />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </RadioGroup>

          {closeError && (
            <FeedbackBanner
              title=''
              description={closeError}
              layout='Inline'
              variant='Standard'
              severity='Error'
            />
          )}

          <div className={`flex gap-small margin-top-small ${dialogStyles.equalButtons}`}>
            <Button
              variant='Alert'
              size='Medium'
              onClick={handleConfirm}
              isLoading={isClosing}
              isDisabled={isConfirmDisabled}>
              {tr('Action.CloseJob', 'Close job')}
            </Button>
            <Button variant='Standard' size='Medium' onClick={onClose} isDisabled={isClosing}>
              {tr('Action.Cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloseJobDialog;
