"use client";

import { Button } from "@/components/ui/button";
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
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { contactSupportAction } from "./contact-support.action";
import {
  ContactSupportSchema,
  type ContactSupportSchemaType,
} from "./contact-support.schema";

export function ContactSupportForm({ onSuccess }: { onSuccess: () => void }) {
  const session = useSession();
  const { t } = useI18n();
  const email = session.data?.user.email ?? "";
  const form = useZodForm({
    schema: ContactSupportSchema,
    defaultValues: { email, subject: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: ContactSupportSchemaType) =>
      resolveActionResult(contactSupportAction(values)),
    onSuccess: () => {
      toast.success(t("support.sent"));
      form.reset();
      onSuccess();
    },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <Form
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
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
      <Button type="submit" disabled={mutation.isPending}>
        {t("support.send")}
      </Button>
    </Form>
  );
}
