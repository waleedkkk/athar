import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import VodafoneCashProviderService from "./providers/vodafone"

export default ModuleProvider(Modules.PAYMENT, {
  services: [VodafoneCashProviderService],
})
