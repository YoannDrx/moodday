import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InterceptDialog } from "@/components/utils/intercept-dialog";
import { getI18n } from "@/i18n/server";
import { SocialProviders } from "@/lib/auth";
import { env } from "@/lib/env";
import { SignInModal } from "./signin";

export default async function SignInDialogPage() {
  const { t } = await getI18n();

  return (
    <InterceptDialog>
      <DialogContent className="bg-card">
        <DialogTitle className="sr-only">{t("auth.signIn.title")}</DialogTitle>
        <div className="flex flex-col items-center justify-center gap-1">
          <MooddayLogo size="sm" href={undefined} className="mt-4" />
          <p className="text-muted-foreground mt-2 text-center">
            {t("auth.signIn.description")}
          </p>
        </div>
        <SignInModal
          providers={Object.keys(SocialProviders ?? {})}
          signupMode={env.PUBLIC_SIGNUP_MODE}
        />
      </DialogContent>
    </InterceptDialog>
  );
}
