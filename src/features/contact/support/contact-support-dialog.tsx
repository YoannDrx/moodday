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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useSession } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { contactSupportAction } from "./contact-support.action";
import type { ContactSupportSchemaType } from "./contact-support.schema";
import { ContactSupportSchema } from "./contact-support.schema";

type ContactSupportDialogProps = PropsWithChildren;

export const ContactSupportDialog = (props: ContactSupportDialogProps) => {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const { t } = useI18n();
  const email = session.data?.user ? session.data.user.email : "";
  const form = useZodForm({
    schema: ContactSupportSchema,
    defaultValues: {
      email: email,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ContactSupportSchemaType) => {
      return resolveActionResult(contactSupportAction(values));
    },
    onSuccess: () => {
      toast.success(t("support.sent"));
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const onSubmit = (values: ContactSupportSchemaType) => {
    mutation.mutate(values);
  };

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
              href={`mailto:${env.NEXT_PUBLIC_EMAIL_CONTACT}`}
            >
              {env.NEXT_PUBLIC_EMAIL_CONTACT}
            </Link>
            {t("support.descriptionSuffix")}
          </DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={async (v) => onSubmit(v)}
          className="flex flex-col gap-4"
        >
          {email ? null : (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.form.email")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("support.subject")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("support.message")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t("support.send")}</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
