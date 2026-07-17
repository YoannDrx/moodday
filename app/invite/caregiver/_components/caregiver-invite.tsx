"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  acceptCaregiverInvitation,
  declineCaregiverInvitation,
  getCaregiverInviteInfo,
} from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

export function CaregiverInvite({
  token,
  isAuthenticated,
}: {
  token: string;
  isAuthenticated: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const {
    data: invite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["caregiver-invite", token],
    enabled: token.length > 0,
    retry: false,
    queryFn: async () => {
      const result = await getCaregiverInviteInfo({ inviteToken: token });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const result = await acceptCaregiverInvitation({ inviteToken: token });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("caregiver.invite.accepted"));
      router.push("/caregiver");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const result = await declineCaregiverInvitation({ inviteToken: token });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("caregiver.invite.declined"));
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle role="heading" aria-level={1}>
              {t("caregiver.invite.notFoundTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("caregiver.invite.notFoundDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    const callbackUrl = `/invite/caregiver?token=${token}`;
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle role="heading" aria-level={1}>
              {t("caregiver.invite.signInRequiredTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("caregiver.invite.signInRequiredDescription")}
            </p>
            <Button asChild className="w-full">
              <Link href={`/auth/signin?callbackUrl=${callbackUrl}`}>
                {t("auth.signIn.submit")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            {t("caregiver.invite.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-muted-foreground">
              {t("caregiver.invite.loading")}
            </p>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <ShieldAlert className="size-4" />
              {t("caregiver.invite.invalid")}
            </div>
          )}

          {!isLoading && invite?.status === "active" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              {t("caregiver.invite.alreadyAccepted")}
            </div>
          ) : null}

          {!isLoading && invite?.status === "declined" ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              {t("caregiver.invite.alreadyDeclined")}
            </div>
          ) : null}

          {!isLoading && invite?.status === "pending" ? (
            <>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{invite.patientName}</p>
                <p className="text-muted-foreground text-sm">
                  {t("caregiver.invite.pendingSubtitle")}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => acceptMutation.mutate()}
                  disabled={
                    acceptMutation.isPending || declineMutation.isPending
                  }
                  className="flex-1"
                >
                  {acceptMutation.isPending
                    ? t("caregiver.invite.accepting")
                    : t("caregiver.invite.accept")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => declineMutation.mutate()}
                  disabled={
                    acceptMutation.isPending || declineMutation.isPending
                  }
                  className="flex-1"
                >
                  {declineMutation.isPending
                    ? t("caregiver.invite.declining")
                    : t("caregiver.invite.decline")}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
