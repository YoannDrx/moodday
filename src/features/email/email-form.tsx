"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useMemo } from "react";
import { addEmailAction } from "./email.action";
import type { EmailActionSchemaType } from "./email.schema";
import { z } from "zod";

type EmailFormProps = {
  submitButtonLabel?: string;
  successMessage?: string;
};

export const EmailForm = ({
  submitButtonLabel,
  successMessage,
}: EmailFormProps) => {
  const { t } = useI18n();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("email.invalid")).toLowerCase(),
      }),
    [t],
  );

  const form = useZodForm({
    schema,
  });

  const submit = useMutation({
    mutationFn: async ({ email }: EmailActionSchemaType) => {
      return resolveActionResult(addEmailAction({ email }));
    },
    onSuccess: () => {
      toast.success(successMessage ?? t("email.success"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const submitLabel = submitButtonLabel ?? t("email.submit");
  const successLabel = successMessage ?? t("email.success");

  return (
    <AnimatePresence mode="wait">
      {submit.isSuccess ? (
        <motion.div
          key="success"
          initial={{
            height: 0,
            opacity: 0,
          }}
          animate={{
            height: "auto",
            opacity: 1,
          }}
        >
          <Alert variant="success">
            <CheckCircle size={20} />
            <AlertTitle>{successLabel}</AlertTitle>
          </Alert>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          animate={{
            height: "auto",
            opacity: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
          }}
        >
          <Form
            form={form}
            onSubmit={async (v) => submit.mutate(v)}
            className="flex flex-col gap-4"
            disabled={submit.isPending}
          >
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="relative w-full">
                    <FormControl>
                      <Input
                        className="border-accent-foreground/20 bg-accent focus-visible:ring-foreground py-5 text-lg"
                        placeholder={t("email.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="absolute -bottom-5" />
                  </FormItem>
                )}
              />
              <LoadingButton
                size="lg"
                variant="invert"
                loading={submit.isPending}
              >
                {submitLabel}
              </LoadingButton>
            </div>
            {submit.isError && (
              <Alert variant="destructive">
                <AlertCircle size={20} />
                <AlertTitle>{submit.error.message}</AlertTitle>
                <AlertDescription>
                  {t("email.errorDescription")}
                </AlertDescription>
              </Alert>
            )}
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
