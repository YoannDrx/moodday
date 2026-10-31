"use client";

import { Bouyotte } from "@/components/brand/bouyotte";
import { Button } from "@/components/ui/button";
import type { CheckInDto } from "@moodday/contracts";
import { labelForNeed, labelForSymptom, stateCatalog } from "@moodday/domain";
import { Lock, Pencil } from "lucide-react";
import { useState } from "react";
import { CheckInForm } from "./check-in-form";

export function CheckInPanel(props: {
  localDate: string;
  timeZone: string;
  partnerName: string | null;
  showsNeedsToPartner: boolean;
  checkIn: CheckInDto | null;
  customNeeds: { id: string; label: string }[];
}) {
  const [editing, setEditing] = useState(!props.checkIn);
  const checkIn = props.checkIn;

  if (editing || !checkIn) {
    return (
      <section className="sticker p-5 sm:p-7" aria-label="Mon point du jour">
        <CheckInForm
          {...props}
          initial={checkIn}
          onDone={() => setEditing(false)}
        />
      </section>
    );
  }

  const needs = checkIn.needs.flatMap(
    (key) => labelForNeed(key, props.customNeeds) ?? [],
  );
  const symptoms = checkIn.symptoms.flatMap(
    (key) => labelForSymptom(key) ?? [],
  );

  return (
    <section
      className="sticker flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7"
      aria-label="Mon point du jour"
    >
      <Bouyotte
        mood={checkIn.state}
        className="size-24"
        steam={checkIn.state === "ok"}
      />
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-muted-foreground text-sm font-bold uppercase">
          Mon point du jour
        </p>
        <p className="font-display text-3xl font-extrabold">
          {stateCatalog[checkIn.state].label}
          {needs[0] && (
            <span className="text-muted-foreground text-xl font-bold">
              {" "}
              · {needs.join(", ").toLowerCase()}
            </span>
          )}
        </p>
        {symptoms.length > 0 && (
          <p className="text-sm">
            <span className="font-bold">Côté corps et tête :</span>{" "}
            {symptoms.join(", ")}
          </p>
        )}
        {checkIn.privateNote && (
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <Lock className="size-3.5" aria-hidden /> Note privée enregistrée
          </p>
        )}
      </div>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil />
        Modifier
      </Button>
    </section>
  );
}
