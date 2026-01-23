"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import {
  acceptCaregiverInvitation,
  declineCaregiverInvitation,
  getCaregiverInviteInfo,
} from "@/features/caregiver/caregiver.action";

export function CaregiverInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { data: session } = useSession();

  const isAuthenticated = !!session?.user;

  const {
    data: invite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["caregiver-invite", token],
    enabled: token.length > 0,
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
      toast.success("Invitation acceptee");
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
      toast.success("Invitation refusee");
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
            <CardTitle>Invitation introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Le lien d'invitation est invalide ou incomplet.
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
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connectez-vous pour accepter cette invitation d'aidant.
            </p>
            <Button asChild className="w-full">
              <Link href={`/auth/signin?callbackUrl=${callbackUrl}`}>
                Se connecter
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
          <CardTitle>Invitation aidant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-muted-foreground">Chargement de l'invitation...</p>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <ShieldAlert className="size-4" />
              Invitation invalide ou expiree.
            </div>
          )}

          {!isLoading && invite && invite.status === "active" && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              Vous avez deja accepte cette invitation.
            </div>
          )}

          {!isLoading && invite && invite.status === "declined" && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              Cette invitation a ete refusee.
            </div>
          )}

          {!isLoading && invite && invite.status === "pending" && (
            <>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {invite.patientName ?? "Un proche"}
                </p>
                <p className="text-muted-foreground text-sm">
                  vous invite a rejoindre son cercle Moodday.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  className="flex-1"
                >
                  {acceptMutation.isPending ? "Validation..." : "Accepter"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => declineMutation.mutate()}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  className="flex-1"
                >
                  {declineMutation.isPending ? "Refus..." : "Refuser"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
