"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/provider";
import { SiteConfig } from "@/site-config";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { useState } from "react";

const ContactSupportForm = dynamic(
  async () =>
    import("./contact-support-form").then((module) => ({
      default: module.ContactSupportForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="bg-muted h-40 animate-pulse rounded-lg motion-reduce:animate-none"
      />
    ),
  },
);

type ContactSupportDialogProps = PropsWithChildren;

export const ContactSupportDialog = (props: ContactSupportDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        {props.children ?? (
          <Button variant="outline">{t("support.contact")}</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("support.title")}</DialogTitle>
          <DialogDescription>
            {t("support.descriptionPrefix")}{" "}
            <Link
              className="text-primary"
              href={`mailto:${SiteConfig.company.email}`}
            >
              {SiteConfig.company.email}
            </Link>
            {t("support.descriptionSuffix")}
          </DialogDescription>
        </DialogHeader>
        <ContactSupportForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
