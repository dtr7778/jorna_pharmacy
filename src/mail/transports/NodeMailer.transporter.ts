import type { Transporter } from "nodemailer"
import { createTransport } from "nodemailer"
import type { SendMailOption } from "../mail.types"

export interface IMailTransport {
  sendMail: (options: SendMailOption) => Promise<string>
  verify: () => Promise<{
    success: boolean
    message: string
  }>
  close: () => void
}

export interface NodeMailerTransporterConfig {
  authUser: string
  authPass: string
  mailFrom: string
}

export class NodeMailerTransporter implements IMailTransport {
  private readonly transporter: Transporter
  private readonly mailFrom: string

  constructor(config: NodeMailerTransporterConfig) {
    this.transporter = createTransport({
      service: "gmail",
      auth: { user: config.authUser, pass: config.authPass },
    })
    this.mailFrom = config.mailFrom
  }

  public async sendMail(options: SendMailOption): Promise<string> {
    const info = await this.transporter.sendMail({
      ...options,
      from: this.mailFrom,
    })

    return info.messageId
  }

  public async verify() {
    try {
      await this.transporter.verify()
      return { success: true, message: "Transporter is ready" }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message || error.name
            : "An unknown error occurred",
      }
    }
  }

  public close() {
    this.transporter.close()
  }
}
