import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import InstaPayProviderService from "./providers/instapay"

export default ModuleProvider(Modules.PAYMENT, {
  services: [InstaPayProviderService],
})
