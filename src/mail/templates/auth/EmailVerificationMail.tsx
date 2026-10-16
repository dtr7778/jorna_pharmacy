/** @jsxRuntime automatic */
import { Section, Text } from "react-email";

import { EmailButton } from "../../components/EmailButton";
import {
  EmailHeading,
  EmailInfoCard,
  EmailLayout,
} from "../../components/EmailLayout";
import { EmailLink } from "../../components/EmailLink";

export interface EmailVerificationMailProps {
  userName: string;
  verifyUrl: string;
  appName: string;
  supportMail: string;
  userAgent?: string;
  ipAddress?: string;
}

export default function EmailVerificationMail({
  userName,
  verifyUrl,
  appName,
  supportMail,
  userAgent,
  ipAddress,
}: EmailVerificationMailProps) {
  return (
    <EmailLayout
      appName={appName}
      previewText="Verify your email address"
      supportMail={supportMail}
    >
      <EmailHeading>Verify your email address</EmailHeading>
      <Text>Hello {userName},</Text>
      <Text>
        Thanks for joining {appName}. Please confirm that this is your email
        address by clicking the button below.
      </Text>

      <Section className="text-center my-6">
        <EmailButton href={verifyUrl}>Verify Email</EmailButton>
      </Section>

      <Section className="my-6">
        <Text className="text-sm text-muted-foreground">
          If the button above doesn&apos;t work, click the following link:
        </Text>
        <EmailLink href={verifyUrl}>{verifyUrl}</EmailLink>
      </Section>

      {/* Security Context Block */}
      {(userAgent || ipAddress) && (
        <EmailInfoCard>
          <Text className="text-xs text-muted-foreground m-0 mb-1 font-bold">
            Security Details
          </Text>
          {ipAddress && (
            <Text className="text-xs text-muted-foreground m-0">
              IP Address: {ipAddress}
            </Text>
          )}
          {userAgent && (
            <Text className="text-xs text-muted-foreground m-0">
              Device: {userAgent}
            </Text>
          )}
          <Text className="text-xs text-muted-foreground m-0 mt-1">
            This link expires in 24 hours.
          </Text>
        </EmailInfoCard>
      )}

      <Text className="text-sm text-muted-foreground mt-4">
        If you did not create an account with us, you can safely ignore this
        email.
      </Text>
    </EmailLayout>
  );
}

EmailVerificationMail.PreviewProps = {
  userName: "John Doe",
  verifyUrl: "http://localhost:3000/api/auth/verify-email",
  appName: "App Name",
  supportMail: "help@app-name.com",
  ipAddress: "192.168.0.0",
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/[IP_ADDRESS] Safari/537.36",
} as EmailVerificationMailProps;
