import { useEffect, useState } from "react";
import {
  dismissPushInvite,
  ensurePushRegistration,
  getPushPermission,
  isPushInviteDismissed,
} from "../../lib/notifications";
import { Button, Card, Row, StatusText, Txt } from "../ui";

/**
 * Explains partner notifications before the system dialog. Shown only once
 * the duo is formed and while the system permission was never asked.
 */
export function PushInviteCard({
  ownerId,
  partnerName,
}: {
  ownerId: string;
  partnerName: string;
}) {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    let active = true;
    void Promise.all([getPushPermission(), isPushInviteDismissed(ownerId)])
      .then(([permission, dismissed]) => {
        if (active) setVisible(permission === "undetermined" && !dismissed);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ownerId]);

  if (!visible) return null;

  const enable = async () => {
    setPending(true);
    try {
      const permission = await ensurePushRegistration({ prompt: true });
      if (permission === "granted") setVisible(false);
      else
        setStatus(
          "Les notifications restent coupées. Tu pourras les activer dans les réglages.",
        );
    } catch {
      setStatus("L’activation n’a pas abouti. Réessaie depuis les réglages.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card
      fill="honey"
      title={`Être prévenu·e quand ${partnerName} pense à toi ?`}
    >
      <Txt>
        Une notification discrète quand ton duo partage son point ou t’envoie un
        geste. Jamais plus d’une par jour pour les points, rien la nuit.
      </Txt>
      <Row>
        <Button
          variant="primary"
          label="Activer"
          pending={pending}
          onPress={() => void enable()}
        />
        <Button
          variant="ghost"
          label="Plus tard"
          disabled={pending}
          onPress={() => {
            setVisible(false);
            void dismissPushInvite(ownerId).catch(() => undefined);
          }}
        />
      </Row>
      <StatusText>{status}</StatusText>
    </Card>
  );
}
