/** @jsxRuntime automatic */
import { Column, Row, Section, Text } from "react-email";

import { EmailButton } from "../../components/EmailButton";
import {
  EmailHeading,
  EmailInfoCard,
  EmailLayout,
} from "../../components/EmailLayout";

export interface RoleChangedMailProps {
  userName: string;
  appName: string;
  supportMail: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  permissionsUrl: string;
}

export default function RoleChangedMail({
  userName,
  appName,
  supportMail,
  oldRole,
  newRole,
  changedBy,
  permissionsUrl,
}: RoleChangedMailProps) {
  return (
    <EmailLayout
      appName={appName}
      previewText="Your account role has been updated"
      supportMail={supportMail}
    >
      <EmailHeading>Your account permissions have changed</EmailHeading>
      <Text>Hello {userName},</Text>
      <Text>
        Your role within {appName} has been updated by{" "}
        <span className="font-semibold">{changedBy}</span>.
      </Text>

      <EmailInfoCard>
        <Row>
          <Column>
            <Text className="text-xs text-muted-foreground m-0 mb-1">
              Previous Role
            </Text>
            <Text className="text-sm font-semibold m-0 line-through text-muted-foreground">
              {oldRole}
            </Text>
          </Column>
          <Column className="px-4">
            <Text className="text-sm m-0">→</Text>
          </Column>
          <Column>
            <Text className="text-xs text-muted-foreground m-0 mb-1">
              New Role
            </Text>
            <Text className="text-sm font-semibold m-0 text-foreground">
              {newRole}
            </Text>
          </Column>
        </Row>
      </EmailInfoCard>

      <Section className="text-center my-6">
        <EmailButton href={permissionsUrl}>View Your Permissions</EmailButton>
      </Section>

      <Text className="text-sm text-muted-foreground">
        If you believe this change was made in error, please contact our support
        team.
      </Text>
    </EmailLayout>
  );
}
RoleChangedMail.PreviewProps = {
  userName: "John Doe",
  appName: "App name",
  supportMail: "help@app-name.com",
  oldRole: "User",
  newRole: "System Admin",
  changedBy: "Super Admin",
  permissionsUrl: "https://localhost:3000/dashboard/permissions",
} satisfies RoleChangedMailProps;
