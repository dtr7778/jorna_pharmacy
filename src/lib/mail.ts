import { createMailService } from "@/mail/createMailService.factory";

import { env } from "./env";

export function getMail() {
  return createMailService({
    appName: env.VITE_APP_NAME,
    authPass: env.MAIL_PASS,
    authUser: env.MAIL_USER,
    mailFrom: `"${env.VITE_APP_NAME}" <${env.VITE_MAIL}>`,
  });
}
