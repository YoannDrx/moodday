"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createExercise } from "@/features/exercise/exercise.action";
import { useI18n } from "@/i18n/provider";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddExerciseForm() {
  const { t } = useI18n();
  const router = useRouter();

  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await createExercise({
        name: values.name,
        description: values.description,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("exercise.add.success"));
      router.push("/exercises");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form form={form} onSubmit={onSubmit} className="space-y-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("exercise.form.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("exercise.form.namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("exercise.form.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("exercise.form.descriptionPlaceholder")}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("exercise.form.descriptionHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createMutation.isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t("common.saving")
                : t("exercise.add.submit")}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
