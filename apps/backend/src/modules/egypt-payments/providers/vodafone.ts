import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import { ManualPaymentOptions } from "./cod-provider"

export class VodafoneCashProviderService extends AbstractPaymentProvider<ManualPaymentOptions> {
  static identifier = "vodafone-cash"

  protected options_: ManualPaymentOptions

  constructor(_: unknown, options: ManualPaymentOptions = {}) {
    super(_, options)
    this.options_ = options
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const id = `vodafone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    return {
      id,
      data: {
        id,
        provider: "vodafone-cash",
        amount: input.amount,
        currency_code: input.currency_code,
        account_info: this.options_.account_info || "01000000000",
        instructions: this.options_.instructions || "حول المبلغ إلى محفظة فودافون كاش ثم أرسل لقطة شاشة للإيصال",
        status: "pending",
      },
      status: PaymentSessionStatus.PENDING,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        authorized_at: new Date().toISOString(),
      },
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: input.data || {},
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return (input.data || {}) as Record<string, unknown>
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        amount: input.amount,
        currency_code: input.currency_code,
      },
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data || {} }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        captured_at: new Date().toISOString(),
      },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        refunded_amount: input.amount,
        refunded_at: new Date().toISOString(),
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        canceled_at: new Date().toISOString(),
      },
    }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default VodafoneCashProviderService
