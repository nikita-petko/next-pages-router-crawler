import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import MultiDocumentUploader from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import FileRejectStatus from '@modules/miscellaneous/components/uploaders/enums/FileRejectStatus';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface DocumentUploaderProps {
  maxCount: number;
  maxSizeMB?: number;
  placeholder: string;
  acceptedMIMETypes: string[];
  required?: boolean;
  enableReactHookFormError?: boolean;
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string;
}

const FIELD_NAME = 'documents';

export function DocumentUploader({
  maxCount,
  placeholder,
  acceptedMIMETypes,
  maxSizeMB,
  required = true,
  translate,
  /**
   * Use react-hook-form as the source for errors
   * as opposed to the state-based error messages.
   * This simplifies the error handling logic as both the
   * validation rules, and the custom error logic uses the
   * same system.
   */
  enableReactHookFormError = false,
}: DocumentUploaderProps) {
  const { control, setError, clearErrors } = useFormContext();
  const [errorMessages, setErrorMessagesState] = useState<string[]>([]);
  const { locale } = useLocalization();
  const localeDefault = locale ?? 'en-US';
  const setErrorMessages = (messages: string[]) => {
    if (enableReactHookFormError) {
      if (messages.length > 0) {
        setError(FIELD_NAME, { message: messages[0] });
      } else {
        clearErrors(FIELD_NAME);
      }
    } else {
      setErrorMessagesState(messages);
    }
  };
  const fileTypes = acceptedMIMETypes
    .map((mt) => {
      const [, ext] = mt.split('/', 2);
      return ext;
    })
    .join(' | ');

  const extraInformationText = maxSizeMB
    ? translate('Label.DocumentUploaderExtraInfoWithSize', {
        fileTypes,
        maxCount: new Intl.NumberFormat(localeDefault, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(maxCount),
        maxFileSize: new Intl.NumberFormat(localeDefault, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(maxSizeMB),
      })
    : translate('Label.DocumentUploaderExtraInfo', {
        fileTypes,
        maxCount: maxCount.toString(),
      });
  return (
    <Controller
      name={FIELD_NAME}
      control={control}
      rules={{
        required: required && translate('Label.SupportingDocsRequired'),
      }}
      render={({ field, fieldState: { error } }) => (
        <MultiDocumentUploader
          documentList={field.value as Doc[]}
          acceptedMIMETypes={acceptedMIMETypes}
          uploadButtonText={translate('Action.Upload')}
          placeholderForEmpty={placeholder}
          extraInformationText={extraInformationText}
          maxCount={maxCount}
          maxSizeMB={maxSizeMB ?? 200}
          errorMessage={
            enableReactHookFormError ? (error?.message && [error?.message]) || [] : errorMessages
          }
          onRemove={(key: string) => {
            const documentList = field.value as Doc[];
            const indexToDelete = documentList.findIndex((doc) => doc.key === key);
            if (indexToDelete > -1) {
              URL.revokeObjectURL(documentList[indexToDelete].key ?? '');
              documentList.splice(indexToDelete, 1);
              field.onChange(Array.from(documentList));
            }
            setErrorMessages([]);
          }}
          onReorder={(sourceIndexInOriginArray: number, destinationIndexInResultArray: number) => {
            const copyList = Array.from(field.value);
            // remove element at source index from array
            const elementToInsert = copyList.splice(sourceIndexInOriginArray, 1);
            // insert the element into destination index position
            copyList.splice(destinationIndexInResultArray, 0, ...elementToInsert);
            field.onChange(copyList);
          }}
          onAdd={(files: File[]) => {
            const filesToUpload: Doc[] = files.map((file) => {
              const fileURL = URL.createObjectURL(file);
              return {
                name: file.name,
                file,
                key: fileURL,
              };
            });
            field.onChange(field.value.concat(filesToUpload));
            setErrorMessages([]);
            if (files.length + field.value.length >= maxCount) {
              setErrorMessages([translate('Error.MaximumFilesTooltip')]);
            }
          }}
          onReject={(rejects: Map<FileRejectStatus, File[]>) => {
            const innerErrorMessages = [];
            if (rejects.has(FileRejectStatus.TooManyFiles)) {
              innerErrorMessages.push(translate('Error.MaximumFilesTooltip'));
            }
            rejects.get(FileRejectStatus.FileTooBig)?.forEach((file) => {
              innerErrorMessages.push(translate('Error.FileIsTooLarge', { filename: file.name }));
            });
            rejects.get(FileRejectStatus.FileWrongType)?.forEach((file) => {
              innerErrorMessages.push(
                translate('Error.FileIsNotSupportedType', { filename: file.name }),
              );
            });
            setErrorMessages(innerErrorMessages);
          }}
        />
      )}
    />
  );
}

function DocumentForm() {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item container direction='column' width='100%' spacing={3}>
        <Grid item>
          <Typography variant='h3'>{translate('Heading.SupportingDocumentation')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1'>
            {translate('Description.SupportingDocumentation')}*
          </Typography>
        </Grid>
      </Grid>
      <Grid item XSmall={10} width='500px'>
        <DocumentUploader
          maxCount={3}
          placeholder=''
          acceptedMIMETypes={['application/pdf']}
          translate={translate}
        />
      </Grid>
    </Grid>
  );
}

export default withTranslation(DocumentForm, [TranslationNamespace.RightsPortal]);
