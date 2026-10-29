import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CashOnDeliveryProviderService from "./providers/cod"

export default ModuleProvider(Modules.PAYMENT, {
  services: [CashOnDeliveryProviderService],
})
