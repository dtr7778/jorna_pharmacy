import { SITE_DESCRIPTION, THEME_COLOR } from "@/constants";

import appCss from "../../styles.css?url";
import { env } from "../env";
import { buildHead } from "./buildHead";

export const { globalHead, head } = buildHead({
  appName: env.VITE_APP_NAME,
  siteUrl: env.VITE_SITE_URL,
  defaultTitle: `Dashboard | ${env.VITE_APP_NAME}`,
  titleTemplate: `%s | Dashboard | ${env.VITE_APP_NAME}`,
  description: SITE_DESCRIPTION,
  themeColor: THEME_COLOR,
  robots: "noindex, nofollow",
  social: true,
  stylesheets: [appCss],
});
