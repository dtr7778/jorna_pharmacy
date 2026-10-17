import type { MailComposerOptions } from "nodemailer";

type MailToOption = { name?: string; address: string };
export type MailTo = string | MailToOption | MailToOption[];

export type SendMailOption = Omit<MailComposerOptions, "from" | "to"> & {
  to: MailTo;
};
