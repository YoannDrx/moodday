import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { SafetyPlanEditor } from "./safety-plan-editor";

export const metadata = { title: "Plan de sécurité personnel" };

export default async function SafetyPlanPage() {
  const user = await getRequiredUser();
  const plan = await prisma.safetyPlan.findUnique({
    where: { userId: user.id },
  });
  return <SafetyPlanEditor initialPlan={plan} ownerId={user.id} />;
}
