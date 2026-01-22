"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/nowts/layout-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaregiverCheckinForm } from "@/features/caregiver/caregiver-checkin-form";
import { CaregiverEventForm } from "@/features/caregiver/caregiver-event-form";
import { useRouter } from "next/navigation";

// Demo: In a real app, this would come from user selection or context
const DEMO_SUBJECT = {
  id: "demo-subject-id",
  name: "Patient Demo",
};

function ObservePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "event" ? "event" : "checkin";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleSuccess = () => {
    router.push("/caregiver");
  };

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
        description="Enregistre une observation ou signale un événement"
      />

      <Card>
        <CardHeader>
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
                subjectId={DEMO_SUBJECT.id}
                subjectName={DEMO_SUBJECT.name}
                onSuccess={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="event" className="mt-0">
              <CaregiverEventForm
                subjectId={DEMO_SUBJECT.id}
                subjectName={DEMO_SUBJECT.name}
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
