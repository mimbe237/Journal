import { IEmailProvider } from "./IEmailProvider";
import { ConsoleEmailProvider } from "./ConsoleEmailProvider";
import { ResendEmailProvider } from "./ResendEmailProvider";

// Factory pour choisir le provider en fonction de l'env
function createEmailProvider(): IEmailProvider {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
    return new ResendEmailProvider(resendApiKey, from);
  }
  
  return new ConsoleEmailProvider();
}

export const emailProvider = createEmailProvider();
