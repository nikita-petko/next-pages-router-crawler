import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { usersClient, isValidUser, ValidatedUser } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import { MaxPayoutCount, MaxPayoutCsvFileSizeInKilobytes } from '../constants/payoutsConstants';

const BYTES_PER_KILOBYTE = 1024;

interface UsePayoutCsvUploadParams {
  checkPayoutEligibility: (userIds: number[]) => Promise<Map<number, string>>;
  groupName: string;
  getExistingPayouts: () => OneTimePayoutBase[];
  onPayoutsUpdate: (payouts: OneTimePayoutBase[]) => void;
}

interface UsePayoutCsvUploadReturn {
  handleCsvUpload: (file: File) => Promise<void>;
  isCsvUploading: boolean;
  csvErrors: string[];
  csvWarnings: string[];
  clearCsvMessages: () => void;
}

interface ParsedCsvData {
  payoutAmountByUserId: Map<number, number>;
  duplicateUserIds: Set<number>;
  errors: string[];
}

interface ValidatedUsersData {
  validUsersById: Map<number, ValidatedUser>;
  notFoundUserIds: Set<number>;
}

interface CategorizedUsers {
  eligiblePayouts: OneTimePayoutBase[];
  ineligibleUserIds: Set<number>;
  nonMemberUserIds: Set<number>;
}

interface MergeResult {
  mergedPayouts: OneTimePayoutBase[];
  skippedCount: number;
}

function usePayoutCsvUpload({
  checkPayoutEligibility,
  groupName,
  getExistingPayouts,
  onPayoutsUpdate,
}: UsePayoutCsvUploadParams): UsePayoutCsvUploadReturn {
  const { translate } = useTranslation();
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);

  const clearCsvMessages = useCallback(() => {
    setCsvErrors([]);
    setCsvWarnings([]);
  }, []);

  const validateCsvHeaders = useCallback(
    (headers: string[]): string | null => {
      const requiredCsvHeaders = ['userId', 'payoutInRobux'];
      const normalizedRequiredHeaders = requiredCsvHeaders.map((h) => h.toLowerCase());
      const missingHeaders = normalizedRequiredHeaders.filter(
        (header) => !headers.includes(header),
      );

      if (missingHeaders.length > 0) {
        return translate('Error.CsvMissingHeaders', {
          requiredHeaders: requiredCsvHeaders.join(', '),
        });
      }
      return null;
    },
    [translate],
  );

  const parseAndValidateCsvRows = useCallback(
    (rows: Array<{ userid: string; payoutinrobux: string }>): ParsedCsvData => {
      const errors: string[] = [];
      const payoutAmountByUserId = new Map<number, number>();
      const duplicateUserIds = new Set<number>();

      rows.forEach(({ userid: userIdStr, payoutinrobux: amountStr }, i) => {
        const line = i + 2; // account for header row and 0 index
        const userId = Number(userIdStr);
        const amount = Number(amountStr);

        if (!userIdStr || !amountStr) {
          errors.push(translate('Error.CsvMissingValueAtLine', { lineNumber: line.toString() }));
        } else if (Number.isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
          errors.push(
            translate('Error.CsvInvalidUserIdAtLine', {
              userIdString: userIdStr,
              lineNumber: line.toString(),
            }),
          );
        } else if (Number.isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
          errors.push(
            translate('Error.CsvInvalidAmountAtLine', {
              amountString: amountStr,
              lineNumber: line.toString(),
            }),
          );
        } else {
          if (payoutAmountByUserId.has(userId)) {
            duplicateUserIds.add(userId);
          }
          payoutAmountByUserId.set(userId, amount);
        }
      });

      return { payoutAmountByUserId, duplicateUserIds, errors };
    },
    [translate],
  );

  const fetchAndValidateUsers = useCallback(
    async (userIds: number[]): Promise<ValidatedUsersData> => {
      const usersResponse = await usersClient.getUsersByIds(userIds);
      const validUsers: ValidatedUser[] = (usersResponse.data ?? []).filter(isValidUser);
      const validUsersById = new Map(validUsers.map((user) => [user.id, user]));

      const notFoundUserIds = new Set(userIds.filter((id) => !validUsersById.has(id)));

      return { validUsersById, notFoundUserIds };
    },
    [],
  );

  const categorizeUsersByEligibility = useCallback(
    async (
      validUsersById: Map<number, ValidatedUser>,
      payoutAmountByUserId: Map<number, number>,
    ): Promise<CategorizedUsers> => {
      const validUserIds = Array.from(validUsersById.keys());
      const eligibilityMap = await checkPayoutEligibility(validUserIds);
      const nonMemberUserIds = new Set<number>();
      const ineligibleUserIds = new Set<number>();
      const eligiblePayouts: OneTimePayoutBase[] = [];

      validUserIds.forEach((userId) => {
        const eligibility = eligibilityMap.get(userId);
        switch (eligibility) {
          case 'Eligible': {
            const user = validUsersById.get(userId)!;
            const amount = payoutAmountByUserId.get(userId)!;
            eligiblePayouts.push({ user, amount: amount.toString() });
            break;
          }
          case 'PayoutRestricted':
            ineligibleUserIds.add(userId);
            break;
          case 'NotInGroup':
            nonMemberUserIds.add(userId);
            break;
          default:
            nonMemberUserIds.add(userId);
            break;
        }
      });

      return { eligiblePayouts, ineligibleUserIds, nonMemberUserIds };
    },
    [checkPayoutEligibility],
  );

  const mergePayoutsWithExisting = useCallback(
    (eligiblePayouts: OneTimePayoutBase[]): MergeResult => {
      const existingPayouts = getExistingPayouts();
      const newPayoutsMap = new Map(
        existingPayouts.map((existingPayout) => [existingPayout.user.id, existingPayout]),
      );
      let skippedCount = 0;

      eligiblePayouts.forEach((newPayout) => {
        const wouldOverwrite = newPayoutsMap.has(newPayout.user.id);
        const isMaxPayoutCountReached = newPayoutsMap.size >= MaxPayoutCount;
        if (wouldOverwrite || !isMaxPayoutCountReached) {
          newPayoutsMap.set(newPayout.user.id, newPayout);
        } else {
          skippedCount += 1;
        }
      });

      return {
        mergedPayouts: Array.from(newPayoutsMap.values()),
        skippedCount,
      };
    },
    [getExistingPayouts],
  );

  const generateWarnings = useCallback(
    (data: {
      duplicateUserIds: Set<number>;
      notFoundUserIds: Set<number>;
      nonMemberUserIds: Set<number>;
      ineligibleUserIds: Set<number>;
      skippedCount: number;
    }): string[] => {
      const warnings: string[] = [];

      if (data.duplicateUserIds.size > 0) {
        warnings.push(
          translate('Message.CsvDuplicateUserIds', {
            duplicatedUserIds: Array.from(data.duplicateUserIds).join(', '),
          }),
        );
      }

      if (data.notFoundUserIds.size > 0) {
        warnings.push(
          translate('Message.CsvUsersNotFound', {
            notFoundUserIds: Array.from(data.notFoundUserIds).join(', '),
          }),
        );
      }

      if (data.nonMemberUserIds.size > 0) {
        warnings.push(
          translate('Message.CsvUsersNotInGroup', {
            groupName,
            nonMemberUserIds: Array.from(data.nonMemberUserIds).join(', '),
          }),
        );
      }

      if (data.ineligibleUserIds.size > 0) {
        warnings.push(
          translate('Message.CsvUsersNotEligible', {
            ineligibleUserIds: Array.from(data.ineligibleUserIds).join(', '),
          }),
        );
      }

      if (data.skippedCount > 0) {
        warnings.push(
          translate('Message.CsvMaxUsersReached', {
            skippedCount: data.skippedCount.toString(),
            maxUsers: MaxPayoutCount.toString(),
          }),
        );
      }

      return warnings;
    },
    [groupName, translate],
  );

  const processParsedCsv = useCallback(
    async (parsedCsvResult: Papa.ParseResult<{ userid: string; payoutinrobux: string }>) => {
      const newCsvErrors: string[] = [];
      const newCsvWarnings: string[] = [];

      try {
        // Validate headers
        const headers = parsedCsvResult.meta.fields || [];
        const headerError = validateCsvHeaders(headers);
        if (headerError) {
          newCsvErrors.push(headerError);
          return;
        }

        // Parse and validate rows
        const { payoutAmountByUserId, duplicateUserIds, errors } = parseAndValidateCsvRows(
          parsedCsvResult.data,
        );

        if (errors.length > 0) {
          newCsvErrors.push(...errors);
          return;
        }

        // Fetch and validate users
        const { validUsersById, notFoundUserIds } = await fetchAndValidateUsers(
          Array.from(payoutAmountByUserId.keys()),
        );

        // Categorize by eligibility and create payouts objects for eligible users
        const { eligiblePayouts, ineligibleUserIds, nonMemberUserIds } =
          await categorizeUsersByEligibility(validUsersById, payoutAmountByUserId);

        // Merge new eligible payouts with existing payouts
        const { mergedPayouts, skippedCount } = mergePayoutsWithExisting(eligiblePayouts);

        // Generate warnings
        const warnings = generateWarnings({
          duplicateUserIds,
          notFoundUserIds,
          nonMemberUserIds,
          ineligibleUserIds,
          skippedCount,
        });
        newCsvWarnings.push(...warnings);

        // Update payouts
        onPayoutsUpdate(mergedPayouts);
      } catch {
        newCsvErrors.push(translate('Error.CsvParsingFailed'));
      } finally {
        setCsvErrors(newCsvErrors);
        setCsvWarnings(newCsvWarnings);
        setIsCsvUploading(false);
      }
    },
    [
      validateCsvHeaders,
      parseAndValidateCsvRows,
      fetchAndValidateUsers,
      categorizeUsersByEligibility,
      mergePayoutsWithExisting,
      generateWarnings,
      onPayoutsUpdate,
      translate,
    ],
  );

  const handleCsvUpload = useCallback(
    async (file: File) => {
      clearCsvMessages();
      setIsCsvUploading(true);

      if (file.size > MaxPayoutCsvFileSizeInKilobytes * BYTES_PER_KILOBYTE) {
        setCsvErrors([
          translate('Error.CsvFileTooLarge', {
            maxSizeStringWithUnits: `${MaxPayoutCsvFileSizeInKilobytes}KB`,
            actualSizeStringWithUnits: `${(file.size / BYTES_PER_KILOBYTE).toFixed(2)}KB`,
          }),
        ]);
        setIsCsvUploading(false);
        return;
      }

      Papa.parse<{ userid: string; payoutinrobux: string }>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
        transform: (v: string) => v.trim(),
        complete: processParsedCsv,
        error: () => {
          setCsvErrors([translate('Error.CsvParsingFailed')]);
          setIsCsvUploading(false);
        },
      });
    },
    [processParsedCsv, translate, clearCsvMessages],
  );

  return {
    handleCsvUpload,
    isCsvUploading,
    csvErrors,
    csvWarnings,
    clearCsvMessages,
  };
}

export default usePayoutCsvUpload;
