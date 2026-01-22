import { combineWithParentMetadata } from "@/lib/metadata";
import { Plus, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/nowts/layout-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaregiverActivityList } from "@/features/caregiver/caregiver-activity-list";
import { getCaregiverSummary } from "@/features/caregiver/caregiver.action";
import { StatCard } from "@/components/nowts/stat-card";

export const generateMetadata = combineWithParentMetadata(async () => {
  return {
    title: "Suivi aidant",
    description: "Observations et événements en tant qu'aidant",
  };
});

export default async function CaregiverPage() {
  // Fetch summary data
  const summaryResult = await getCaregiverSummary();
  const summary = summaryResult.data;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Suivi aidant"
        description="Observe et accompagne un proche dans son parcours"
        action={{
          label: "Nouvelle observation",
          href: "/caregiver/observe",
          icon: Plus,
        }}
      />

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Observations cette semaine"
          value={summary?.observationsThisWeek ?? 0}
          icon={Eye}
          color="info"
        />
        <StatCard
          title="Observations ce mois"
          value={summary?.observationsThisMonth ?? 0}
          icon={Eye}
          color="default"
        />
        <StatCard
          title="Événements ce mois"
          value={summary?.eventsThisMonth ?? 0}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Événements préoccupants"
          value={summary?.concerningEvents ?? 0}
          icon={AlertTriangle}
          color={
            summary?.concerningEvents && summary.concerningEvents > 0
              ? "danger"
              : "success"
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/caregiver/observe">
            <Eye className="mr-2 size-4" />
            Faire un check-in
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/caregiver/observe?tab=event">
            <AlertTriangle className="mr-2 size-4" />
            Signaler un événement
          </Link>
        </Button>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <CaregiverActivityList />
        </CardContent>
      </Card>
    </div>
  );
}
