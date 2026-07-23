export const ADD_CREDIT_CARD_SUCCESS = 'add_credit_card_success';

class PaymentMethodDrawerBroadcastChannelClient {
  private paymentMethodDrawerBroadcastChannel: BroadcastChannel | undefined;

  constructor() {
    try {
      this.paymentMethodDrawerBroadcastChannel = new BroadcastChannel('payment_method_drawer');
    } catch {
      // purposefully empty - we wrap in try/catch because BroadcastChannel is not supported in all browsers
      // for example, it is not supported in Safari for mobile devices
    }
  }

  postMessage(message: string): void {
    if (this.paymentMethodDrawerBroadcastChannel) {
      this.paymentMethodDrawerBroadcastChannel.postMessage(message);
    }
  }

  setOnMessage(onMessage: () => void): void {
    if (this.paymentMethodDrawerBroadcastChannel) {
      this.paymentMethodDrawerBroadcastChannel.onmessage = onMessage;
    }
  }
}

export const PaymentMethodDrawerBroadcastChannel = new PaymentMethodDrawerBroadcastChannelClient();
