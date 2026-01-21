"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Heart, Pill, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  completeOnboarding,
  updateOnboardingProgress,
} from "@/features/preferences/preferences.action";
import { useI18n } from "@/i18n/provider";

type OnboardingStep = {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
};

export function OnboardingWizard() {
  const { t } = useI18n();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      icon: <Heart className="size-12 text-pink-500" />,
      titleKey: "onboarding.steps.welcome.title",
      descriptionKey: "onboarding.steps.welcome.description",
    },
    {
      icon: <TrendingUp className="size-12 text-blue-500" />,
      titleKey: "onboarding.steps.mood.title",
      descriptionKey: "onboarding.steps.mood.description",
    },
    {
      icon: <Pill className="size-12 text-purple-500" />,
      titleKey: "onboarding.steps.medications.title",
      descriptionKey: "onboarding.steps.medications.description",
    },
    {
      icon: <Sparkles className="size-12 text-amber-500" />,
      titleKey: "onboarding.steps.ready.title",
      descriptionKey: "onboarding.steps.ready.description",
    },
  ];

  const updateProgressMutation = useMutation({
    mutationFn: async (step: number) => {
      const result = await updateOnboardingProgress({ step });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const result = await completeOnboarding();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("onboarding.complete"));
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateProgressMutation.mutate(nextStep);
    } else {
      completeMutation.mutate();
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
  };

  const step = steps[currentStep];

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6">
          {/* Progress dots */}
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">{step.icon}</div>
            <h2 className="mb-3 text-2xl font-bold">{t(step.titleKey)}</h2>
            <p className="text-muted-foreground mb-8">
              {t(step.descriptionKey)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleNext}
              disabled={completeMutation.isPending}
              className="w-full"
            >
              {currentStep === steps.length - 1
                ? t("onboarding.start")
                : t("onboarding.next")}
              <ChevronRight className="ml-2 size-4" />
            </Button>
            {currentStep < steps.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={completeMutation.isPending}
                className="w-full"
              >
                {t("onboarding.skip")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
