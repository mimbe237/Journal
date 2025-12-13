import { Resend } from 'resend';
import { IEmailProvider, EmailMessage } from "./IEmailProvider";

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress: string = "onboarding@resend.dev") {
    this.resend = new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text
      });

      if (error) {
        console.error("Resend API Error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }
      
      console.log(`[Resend] Email sent to ${message.to} (ID: ${data?.id})`);
    } catch (error) {
      console.error("[Resend] Exception:", error);
      throw error;
    }
  }
}
