import { IEmailProvider, EmailMessage } from "./IEmailProvider";

export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(message: EmailMessage): Promise<void> {
    console.log("====== EMAIL SENT (Console Provider) ======");
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log("--- HTML Content ---");
    console.log(message.html);
    console.log("===========================================");
  }
}
