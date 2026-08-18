"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

type DownloadState = "ready" | "missing" | "loading" | "done" | "error";

export function RegulatoryExportDownload({
  requestReference,
}: {
  requestReference: string;
}) {
  const tokenRef = useRef<string | null>(null);
  const [state, setState] = useState<DownloadState>("ready");

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    tokenRef.current = fragment.get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!tokenRef.current) setState("missing");
  }, []);

  const download = async () => {
    const token = tokenRef.current;
    if (!token) return setState("missing");
    setState("loading");
    try {
      const response = await fetch(
        `/api/regulatory-export/${encodeURIComponent(requestReference)}`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
      if (!response.ok) {
        if (response.status === 410) tokenRef.current = null;
        throw new Error("download_unavailable");
      }
      const body = await response.blob();
      const objectUrl = URL.createObjectURL(body);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `moodday-regulatory-export-${requestReference.slice(0, 8)}.json.enc`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      tokenRef.current = null;
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Export réglementaire Moodday
        </h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Ce fichier est chiffré. Utilisez la clé reçue par un canal distinct
          pour l’ouvrir. Le lien expire sous 24 heures et ne fonctionne qu’une
          seule fois.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          This file is encrypted. Use the key received through a separate
          channel. The link expires within 24 hours and can only be used once.
        </p>
        <div className="mt-8">
          {state === "done" ? (
            <p role="status">Téléchargement démarré / Download started.</p>
          ) : state === "missing" ? (
            <p role="alert">Lien invalide ou incomplet / Invalid link.</p>
          ) : (
            <Button onClick={download} disabled={state === "loading"}>
              {state === "loading"
                ? "Préparation…"
                : "Télécharger le fichier chiffré"}
            </Button>
          )}
          {state === "error" ? (
            <p role="alert" className="text-destructive mt-4 text-sm">
              Le lien est indisponible ou a expiré. Contactez Moodday sans
              transmettre votre clé.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
