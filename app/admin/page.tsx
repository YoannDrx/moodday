import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";

const operationalRows = async () => {
  const [
    heartbeats,
    retryJobs,
    deadJobs,
    failedStripe,
    failedEmail,
    deadNotifications,
    overdueDeletion,
  ] = await Promise.all([
    prisma.operationalHeartbeat.findMany({
      select: {
        serviceName: true,
        lastSuccessAt: true,
        consecutiveFailures: true,
        alertState: true,
      },
      orderBy: { serviceName: "asc" },
    }),
    prisma.operationalJobRun.count({ where: { status: "retry" } }),
    prisma.operationalJobRun.count({ where: { status: "dead" } }),
    prisma.stripeWebhookEvent.count({ where: { status: "failed" } }),
    prisma.emailWebhookEvent.count({ where: { status: "failed" } }),
    prisma.notificationDelivery.count({ where: { status: "dead" } }),
    prisma.externalDeletionJob.count({
      where: {
        status: { in: ["pending", "processing", "retry"] },
        retentionUntil: { lte: new Date() },
      },
    }),
  ]);

  return {
    heartbeats,
    counters: [
      ["Jobs en attente de reprise", retryJobs],
      ["Jobs définitivement échoués", deadJobs],
      ["Webhooks Stripe échoués", failedStripe],
      ["Webhooks e-mail échoués", failedEmail],
      ["Notifications en dead-letter", deadNotifications],
      ["Suppressions externes hors délai", overdueDeletion],
    ] as const,
  };
};

export default async function AdminPage() {
  await getRequiredAdmin();
  const { heartbeats, counters } = await operationalRows();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Exploitation Moodday</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          États techniques uniquement. Aucune note, adresse e-mail ou donnée de
          santé n’est accessible depuis cet espace.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counters.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-semibold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3" aria-labelledby="heartbeat-title">
        <h2 id="heartbeat-title" className="text-lg font-semibold">
          Heartbeats
        </h2>
        {heartbeats.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun heartbeat enregistré.
          </p>
        ) : (
          <div className="grid gap-3">
            {heartbeats.map((heartbeat) => {
              const healthy =
                heartbeat.alertState !== "alert" &&
                heartbeat.consecutiveFailures < 2;
              return (
                <Card key={heartbeat.serviceName}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{heartbeat.serviceName}</p>
                      <p className="text-muted-foreground text-sm">
                        Dernier succès :{" "}
                        {heartbeat.lastSuccessAt?.toISOString() ?? "jamais"}
                      </p>
                    </div>
                    <Badge variant={healthy ? "secondary" : "destructive"}>
                      {healthy ? "ok" : "dégradé"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
