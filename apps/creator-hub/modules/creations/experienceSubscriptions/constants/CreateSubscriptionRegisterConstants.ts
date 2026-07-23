import ProductTypes from '../enums/ProductTypes';
import SubscriptionPeriod from '../enums/SubscriptionPeriod';

export const ImageDimension = 150;
export const CreationLimit = 50;
export const MinimumRobuxPriceForSubscription = 49;
export const DeveloperSharePercentageForRobuxSubscriptions = 0.7;

export const CreateSubscriptionRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 29,
    pattern: {
      value: /^[a-zA-Z0-9.,:/!?@#&' ]+$/,
      message: 'Error.InvalidSubscriptionName',
    },
  },
  description: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 1000,
    validate: {
      minLength: (name: string) => {
        return name.length >= 10 || 'Error.DescriptionMinimum';
      },
    },
  },
  file: { required: 'Message.RequiredFieldMissed' },
  productType: {
    required: 'Message.RequiredFieldMissed',
    pattern: { value: /^[+]?\d+([.]\d+)?$/, message: 'Error.InvalidNumber' },
  },
  price: { required: 'Message.RequiredFieldMissed' },
  period: { required: 'Message.RequiredFieldMissed' },
  priceInRobux: {
    required: 'Message.RequiredFieldMissed',
    min: {
      value: MinimumRobuxPriceForSubscription,
      message: 'Label.RobuxMinimumHelperText',
    },
    validate: (value: number | string) => {
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      if (Number.isNaN(numValue) || numValue < MinimumRobuxPriceForSubscription) {
        return 'Label.RobuxMinimumHelperText';
      }
      return true;
    },
  },
};

export const CreateSubscriptionFormDefaultValue = {
  name: '',
  description: '',
  file: null,
  productType: '',
  price: '',
  period: '1',
  currencyType: '',
  priceInRobux: MinimumRobuxPriceForSubscription,
  isRegionalPricingEnabled: true,
};

export type CreateSubscriptionFormType = {
  name: string;
  description: string;
  file: File | null;
  productType: string;
  price: string;
  period: string;
  currencyType: string;
  priceInRobux: number;
  isRegionalPricingEnabled: boolean;
};

interface EnumTypeMenuSelection {
  name: string;
  value: string;
  description: string;
}

export const ProductTypeMenuSelection: EnumTypeMenuSelection[] = [
  {
    name: 'Label.Durable',
    value: ProductTypes.Durable,
    description: 'Message.DurableDescription',
  },
  {
    name: 'Label.Consumable',
    value: ProductTypes.Consumable,
    description: 'Message.ConsumableDescription',
  },
  {
    name: 'Label.Currency',
    value: ProductTypes.Currency,
    description: 'Message.CurrencyDescription',
  },
];

export const SubscriptionPeriodMenuSelection: EnumTypeMenuSelection[] = [
  { name: 'Label.Monthly', value: SubscriptionPeriod.Monthly, description: '' },
];
