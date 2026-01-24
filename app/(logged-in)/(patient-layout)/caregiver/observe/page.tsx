"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/nowts/layout-components";
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

function ObservePageContent() {
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
    ? { id: resolvedPatient.patientId, name: resolvedPatient.patientName }
    : session?.user
      ? { id: session.user.id, name: session.user.name || "Moi" }
      : null;

  if (isPending) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-24" />
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Utilisateur non connecté</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/caregiver">
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Nouvelle observation"
        description={`Enregistre une observation pour ${subject.name}`}
      />

      <Card>
        <CardHeader>
          {!patientsLoading && patients && patients.length > 0 && (
            <div className="mb-6 space-y-2">
              <Label>Patient</Label>
              <Select
                value={subject.id}
                onValueChange={(value) => setSelectedPatientId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem
                      key={patient.patientId}
                      value={patient.patientId}
                    >
                      {patient.patientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checkin" className="flex items-center gap-2">
                <Eye className="size-4" />
                Check-in
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Événement
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="checkin" className="mt-0">
              <CaregiverCheckinForm
                subjectId={subject.id}
                subjectName={subject.name}
                onSuccess={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="event" className="mt-0">
              <CaregiverEventForm
                subjectId={subject.id}
                subjectName={subject.name}
                onSuccess={handleSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ObservePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-8">
          Chargement...
        </div>
      }
    >
      <ObservePageContent />
    </Suspense>
  );
}
