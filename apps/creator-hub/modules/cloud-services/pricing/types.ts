import type {
  ResponseAccountState as AccountState,
  BillDetailsResponse,
  ResourceUsage as ClientResourceUsage,
  ServiceUsage as ClientServiceUsage,
  ConsumerConfigurationResponse,
  ServiceConfiguration,
  BillStatus,
  Money,
} from '@rbx/client-service-efficiency-api/v1';

export {
  ResponseAccountState as AccountState,
  BillStatus,
} from '@rbx/client-service-efficiency-api/v1';
export type {
  CheckEligibilityResponse,
  ConsumerUsage as UniverseUsage,
  ServiceConfiguration,
  ResourceConfiguration,
  Money,
  EligibilityRequirementResult,
  BillDetailsResponseBillingAddress,
  Payment,
} from '@rbx/client-service-efficiency-api/v1';
// conversionRate is added explicitly because the pinned @rbx/client-service-efficiency-api SDK
// does not yet expose it. Once the SDK is republished from the updated swagger and bumped, the
// intersection becomes redundant (Required<BillDetailsResponse> will already include it).
export type BillDetails = Required<BillDetailsResponse> & { conversionRate: number | null };
export type ServiceUsage = Required<ClientServiceUsage>;
export type ResourceUsage = Required<ClientResourceUsage>;
// null and undefined should not be valid value
export type UnlockServiceConfigurations = Required<
  Omit<ConsumerConfigurationResponse, 'serviceConfigurations'>
> & { serviceConfigurations: Array<ServiceConfiguration> };
export type CreatePaymentProfile = Required<CreatePaymentProfileResponse>;

export type UnlockEligibilities = {
  generalEligibility: boolean;
  premiumEligibility: boolean;
};

export type TUnlockServiceInfo = {
  resourceConfigurations: TUnlockResourceForm[];
  serviceId: ServiceId;
  monthlyBudget: Money | null;
  budgetLevel: BudgetLevel;
  serviceBudget: string;
};

export type TUnlockServiceForm = {
  unlockConfiguration: TUnlockServiceInfo[];
};

export type TUnlockResourceForm = {
  resourceId: ResourceId;
  isUnlocked: boolean;
  monthlyBudget: Money | null;
  currency: string;
  unitCost: string;
  resourceBudget: string;
  price: { cost: string; unitAmount: number };
};

export type TResourceIndexInfo = {
  serviceId: ServiceId;
  resourceIndexesInFormArray: number[];
  monthlyBudget: Money | null;
  budgetLevel: BudgetLevel;
};

export enum EligibilityRequirement {
  Age = 'Age',
  AccountCountry = 'AccountCountry',
  IdVerified = 'IdVerified',
  EmailVerified = 'EmailVerified',
  ModerationStatus = 'ModerationStatus',
  Premium = 'Premium',
}

export enum TaxIdType {
  Invalid = 'Invalid',
  UnitedStatesEin = 'UnitedStatesEin',
  EuropeanVatNumber = 'EuropeanVatNumber',
  UnitedKingdomVatNumber = 'UnitedKingdomVatNumber',
  CanadianBusinessNumber = 'CanadianBusinessNumber',
  CanadianGstHstNumber = 'CanadianGstHstNumber',
  MexicanRfcNumber = 'MexicanRfcNumber',
}

export enum ResponseAccountState {
  Invalid = 'Invalid',
  Normal = 'Normal',
  Overdue = 'Overdue',
  Suspended = 'Suspended',
}

export enum BudgetLevel {
  ResourceOnly = 'ResourceOnly',
  ServiceOnly = 'ServiceOnly',
}

export enum ActivityType {
  Bill = 'Bill',
  Payment = 'Payment',
  Credit = 'Credit',
}

export enum ActivityTypeOptions {
  All = 'All',
  Bill = 'Bill',
  Payment = 'Payment',
  Credit = 'Credit',
}

export enum AccountTaxType {
  Invalid = 'Invalid',
  Individual = 'Individual',
  Business = 'Business',
}

export enum TransactionStatus {
  Successful = 'Successful',
  Failed = 'Failed',
  Pending = 'Pending',
  Invalid = 'Invalid',
}

export type Account = {
  accountTaxType: AccountTaxType;
  accountName: string;
  taxId: string | undefined;
  taxIdType: TaxIdType | undefined;
};

export type ActivityRowInfo = {
  id: string;
  date: Date;
  amount: number;
  status: BillStatus;
};

export type BalanceInfo = {
  accountState: AccountState;
  outstandingBalance: number;
  chargingThreshold: number;
  monthToDateBalance: number;
};

export enum ServiceId {
  MemoryStore = 'universe-memory-store',
  DataStore = 'data-store',
  DataStoreStorage = 'data-store-storage',
  AvatarGeneration = 'avatar-generation',
  TextToSpeech = 'text-to-speech',
  SpeechToText = 'speech-to-text',
  Rcc = 'rcc',
}

export enum ResourceId {
  Memory = 'memory',
  RequestUnits = 'request-units',
  AvatarPreviewGeneration = 'avatar_preview_generations',
  AvatarModelGeneration = 'avatar_model_generations',
  Requests = 'requests',
  Storage = 'storage',
  StandardReadRequests = 'standard-read-requests',
  StandardWriteRequests = 'standard-write-requests',
  StandardRemoveRequests = 'standard-remove-requests',
  StandardListRequests = 'standard-list-requests',
  OrderedReadRequests = 'ordered-read-requests',
  OrderedWriteRequests = 'ordered-write-requests',
  OrderedRemoveRequests = 'ordered-remove-requests',
  OrderedListRequests = 'ordered-list-requests',
  CcuCores = 'ccu-cores',
}

export const eligibilityToTranslationKeys: Record<
  EligibilityRequirement,
  {
    title: string;
    description: string;
    generic: boolean;
    button?: string;
    link?: string;
  }
> = {
  [EligibilityRequirement.Age]: {
    title: 'Label.AgeEligibilityRequirement',
    description: 'Description.AgeEligibilityRequirement',
    generic: true,
  },
  [EligibilityRequirement.AccountCountry]: {
    title: 'Label.AccountCountryEligibilityRequirement',
    description: 'Description.AccountCountryEligibilityRequirement',
    generic: true,
  },
  [EligibilityRequirement.IdVerified]: {
    title: 'Label.IdVerifiedEligibilityRequirement',
    description: 'Description.IdVerifiedEligibilityRequirement',
    button: 'Action.Verify',
    link: `https://www.${process.env.robloxSiteDomain}/my/account#!/info`,
    generic: true,
  },
  [EligibilityRequirement.EmailVerified]: {
    title: 'Label.EmailVerifiedEligibilityRequirement',
    description: 'Description.EmailVerifiedEligibilityRequirement',
    button: 'Action.Verify',
    link: `https://www.${process.env.robloxSiteDomain}/my/account#!/info`,
    generic: true,
  },
  [EligibilityRequirement.ModerationStatus]: {
    title: 'Label.ModerationStatusEligibilityRequirement',
    description: 'Description.ModerationStatusEligibilityRequirement',
    generic: true,
  },
  [EligibilityRequirement.Premium]: {
    title: 'Label.PremiumEligibilityRequirement',
    description: 'Description.PremiumEligibilityRequirement',
    link: `https://www.${process.env.robloxSiteDomain}/premium/membership?ctx=leftnav`,
    button: 'Action.Subscribe',
    generic: false,
  },
};

export const serviceIdToBillTranslationKeys: Record<ServiceId, string> = {
  [ServiceId.MemoryStore]: 'Label.MemoryStoresServiceInBill',
  [ServiceId.DataStore]: 'Heading.DataStores',
  [ServiceId.DataStoreStorage]: 'Label.DataStoresStorageServiceInBill',
  [ServiceId.AvatarGeneration]: 'Label.AvatarGenerationServiceInBill',
  [ServiceId.TextToSpeech]: 'Label.TextToSpeechServiceInBill',
  [ServiceId.SpeechToText]: 'Label.SpeechToTextServiceInBill',
  [ServiceId.Rcc]: 'Label.RccServiceInBill',
};

export const resourceIdToBillTranslationKeys: Record<ResourceId, string> = {
  [ResourceId.Memory]: 'Description.MemoryResourceInBill',
  [ResourceId.RequestUnits]: 'Description.RequestUnitsResourceInBill',
  [ResourceId.AvatarPreviewGeneration]: 'Description.PreviewGenerationResourceInBill',
  [ResourceId.AvatarModelGeneration]: 'Description.ModelGenerationResourceInBill',
  [ResourceId.Requests]: 'Description.RequestsResourceInBill',
  [ResourceId.Storage]: 'Description.MemoryResourceInBill',
  [ResourceId.StandardReadRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.StandardWriteRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.StandardRemoveRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.StandardListRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.OrderedReadRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.OrderedWriteRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.OrderedRemoveRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.OrderedListRequests]: 'Description.RequestsResourceInBill',
  [ResourceId.CcuCores]: 'Description.RccCoresResourceInBill',
};

export const serviceIdToUnlockTranslationKeys: Record<ServiceId, string> = {
  [ServiceId.MemoryStore]: 'Title.MemoryStoreInUnlock',
  [ServiceId.DataStore]: 'Title.DataStoreInUnlock',
  [ServiceId.DataStoreStorage]: 'Title.StorageInUnlock',
  [ServiceId.AvatarGeneration]: 'Title.AvatarGenerationInUnlock',
  [ServiceId.TextToSpeech]: 'Title.TextToSpeechInUnlock',
  [ServiceId.SpeechToText]: 'Title.SpeechToTextInUnlock',
  [ServiceId.Rcc]: 'Title.RccInUnlock',
};

export const taxIdTypeToTranslationKey: Record<TaxIdType, string> = {
  [TaxIdType.Invalid]: 'Label.TaxIdTypeInvalid',
  [TaxIdType.UnitedStatesEin]: 'Label.TaxIdTypeUnitedStatesEin',
  [TaxIdType.EuropeanVatNumber]: 'Label.TaxIdTypeEuropeanVatNumber',
  [TaxIdType.UnitedKingdomVatNumber]: 'Label.TaxIdTypeUnitedKingdomVatNumber',
  [TaxIdType.CanadianBusinessNumber]: 'Label.TaxIdTypeCanadianBusinessNumber',
  [TaxIdType.CanadianGstHstNumber]: 'Label.TaxIdTypeCanadianGstHstNumber',
  [TaxIdType.MexicanRfcNumber]: 'Label.TaxIdTypeMexicanRfcNumber',
};

export const accountTaxTypeToTranslationKey: Record<AccountTaxType, string> = {
  [AccountTaxType.Invalid]: 'Label.AccountTaxTypeInvalid',
  [AccountTaxType.Individual]: 'Label.IndividualAccount',
  [AccountTaxType.Business]: 'Label.BusinessAccount',
};

export const resourceIdToUnlockTranslationKeys: Record<
  ResourceId,
  {
    title: string;
    description: string;
  }
> = {
  [ResourceId.Memory]: {
    title: 'Title.MemorySizeInUnlock',
    description: 'Description.MemorySizeInUnlock',
  },
  [ResourceId.RequestUnits]: {
    title: 'Title.RequestUnitsInUnlock',
    description: 'Description.RequestUnitsInUnlock',
  },
  [ResourceId.AvatarPreviewGeneration]: {
    title: 'Title.PreviewGenerationInUnlock',
    description: 'Description.PreviewGenerationInUnlock',
  },
  [ResourceId.AvatarModelGeneration]: {
    title: 'Title.ModelGenerationInUnlock',
    description: 'Description.ModelGenerationInUnlock',
  },
  [ResourceId.Requests]: {
    title: 'Title.RequestsInUnlock',
    description: 'Description.RequestResourceInUnlock',
  },
  [ResourceId.Storage]: {
    title: 'Title.StorageInUnlock',
    description: 'Description.StorageInUnlock',
  },
  [ResourceId.StandardReadRequests]: {
    title: 'Title.StandardReadRequestsInUnlock',
    description: 'Description.StandardReadRequestsInUnlock',
  },
  [ResourceId.StandardWriteRequests]: {
    title: 'Title.StandardWriteRequestsInUnlock',
    description: 'Description.StandardWriteRequestsInUnlock',
  },
  [ResourceId.StandardRemoveRequests]: {
    title: 'Title.StandardRemoveRequestsInUnlock',
    description: 'Description.StandardRemoveRequestsInUnlock',
  },
  [ResourceId.StandardListRequests]: {
    title: 'Title.StandardListRequestsInUnlock',
    description: 'Description.StandardListRequestsInUnlock',
  },
  [ResourceId.OrderedReadRequests]: {
    title: 'Title.OrderedReadRequestsInUnlock',
    description: 'Description.OrderedReadRequestsInUnlock',
  },
  [ResourceId.OrderedWriteRequests]: {
    title: 'Title.OrderedWriteRequestsInUnlock',
    description: 'Description.OrderedWriteRequestsInUnlock',
  },
  [ResourceId.OrderedRemoveRequests]: {
    title: 'Title.OrderedRemoveRequestsInUnlock',
    description: 'Description.OrderedRemoveRequestsInUnlock',
  },
  [ResourceId.OrderedListRequests]: {
    title: 'Title.OrderedListRequestsInUnlock',
    description: 'Description.OrderedListRequestsInUnlock',
  },
  [ResourceId.CcuCores]: {
    title: 'Title.RccCoresInUnlock',
    description: 'Description.RccCoresInUnlock',
  },
};

export type CreatePaymentProfileResponse = {
  clientSecret: string;
};

export type PaymentProfile = {
  paymentProfileId?: string;
  paymentProfileOwnerType?: string;
  cardNetwork?: string;
  last4Digits?: string;
  expMonth?: number;
  expYear?: number;
};

export type StripeAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export const PRICE_MAX_DECIMALS = 9;
