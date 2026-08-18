"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Eye, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { PageLayout } from "@/components/nowts/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CaregiverCheckinForm } from "@/features/caregiver/caregiver-checkin-form";
import { CaregiverEventForm } from "@/features/caregiver/caregiver-event-form";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getMyPatients } from "@/features/caregiver/caregiver.action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/provider";

function ObservePageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["my-patients"],
    queryFn: async () => {
      const result = await getMyPatients();
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });
  const initialTab = searchParams.get("tab") === "event" ? "event" : "checkin";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].patientId);
    }
  }, [patients, selectedPatientId]);

  const handleSuccess = () => {
    router.push("/caregiver");
  };

  const resolvedPatient =
    selectedPatientId && patients
      ? patients.find((p) => p.patientId === selectedPatientId)
      : patients?.[0];

  const subject = resolvedPatient
    ? {
        id: resolvedPatient.patientId,
        relationshipId: resolvedPatient.id,
        name: resolvedPatient.patientName,
      }
    : null;

  if (isPending || patientsLoading) {
    return (
      <PageLayout
        title={t("caregiver.observe.title")}
        maxWidth="4xl"
        showBlobs={false}
      >
        <Skeleton className="mb-6 h-10 w-24" />
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </PageLayout>
    );
  }

  if (!session?.user) {
    return (
      <PageLayout
        title={t("caregiver.observe.title")}
        maxWidth="4xl"
        showBlobs={false}
      >
        <p className="text-muted-foreground">{t("auth.notSignedIn")}</p>
      </PageLayout>
    );
  }

  if (!subject) {
    return (
      <PageLayout
        title={t("caregiver.observe.title")}
        maxWidth="4xl"
        showBlobs={false}
      >
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <Users className="mb-4 size-10 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold">
              {t("caregiver.observe.emptyTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm">
              {t("caregiver.observe.emptyDescription")}
            </p>
            <Button asChild variant="outline" className="mt-6 min-h-11">
              <Link href="/caregiver">
                <ArrowLeft />
                {t("actions.back")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("caregiver.observe.title")}
      subtitle={t("caregiver.observe.description", { name: subject.name })}
      maxWidth="4xl"
      showBlobs={false}
      headerRight={
        <Button asChild variant="ghost" size="sm">
          <Link href="/caregiver">
            <ArrowLeft className="mr-2 size-4" />
            {t("actions.back")}
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="mb-6 space-y-2">
            <Label>{t("caregiver.observe.patientLabel")}</Label>
            <Select
              value={subject.id}
              onValueChange={(value) => setSelectedPatientId(value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("caregiver.observe.patientPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {(patients ?? []).map((patient) => (
                  <SelectItem key={patient.patientId} value={patient.patientId}>
                    {patient.patientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checkin" className="flex items-center gap-2">
                <Eye className="size-4" />
                {t("caregiver.observe.tabCheckin")}
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                {t("caregiver.observe.tabEvent")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="checkin" className="mt-0">
              <CaregiverCheckinForm
                relationshipId={subject.relationshipId}
                subjectName={subject.name}
                onSuccess={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="event" className="mt-0">
              <CaregiverEventForm
                relationshipId={subject.relationshipId}
                subjectName={subject.name}
                onSuccess={handleSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export default function ObservePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 pb-8 lg:px-6">Chargement...</div>
      }
    >
      <ObservePageContent />
    </Suspense>
  );
}
