import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { getFeatureAvailability } from "@/lib/features/availability";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  Heart,
  Pill,
  Shield,
  Sparkles,
  Rocket,
  Settings,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type GuideItem = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  contentKey?: string;
  href?: string;
  requires?: "caregiverSharing";
  color: string;
  bgColor: string;
};

type GuideCategory = {
  titleKey: string;
  descriptionKey: string;
  guides: GuideItem[];
};

const guideCategories: GuideCategory[] = [
  {
    titleKey: "guides.categories.start.title",
    descriptionKey: "guides.categories.start.description",
    guides: [
      {
        icon: Rocket,
        titleKey: "guides.items.gettingStarted.title",
        descriptionKey: "guides.items.gettingStarted.description",
        contentKey: "guides.items.gettingStarted.content",
        color: "from-[#1D7680] to-[#2BA09F]",
        bgColor: "bg-[#1D7680]/10",
      },
      {
        icon: Settings,
        titleKey: "guides.items.profile.title",
        descriptionKey: "guides.items.profile.description",
        contentKey: "guides.items.profile.content",
        color: "from-violet-500 to-purple-600",
        bgColor: "bg-violet-500/10",
      },
    ],
  },
  {
    titleKey: "guides.categories.features.title",
    descriptionKey: "guides.categories.features.description",
    guides: [
      {
        icon: Brain,
        titleKey: "guides.items.moodTracking.title",
        descriptionKey: "guides.items.moodTracking.description",
        contentKey: "guides.items.moodTracking.content",
        color: "from-amber-500 to-orange-600",
        bgColor: "bg-amber-500/10",
      },
      {
        icon: Pill,
        titleKey: "guides.items.medications.title",
        descriptionKey: "guides.items.medications.description",
        contentKey: "guides.items.medications.content",
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: BarChart3,
        titleKey: "guides.items.reports.title",
        descriptionKey: "guides.items.reports.description",
        contentKey: "guides.items.reports.content",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-500/10",
      },
    ],
  },
  {
    titleKey: "guides.categories.sharing.title",
    descriptionKey: "guides.categories.sharing.description",
    guides: [
      {
        icon: Heart,
        titleKey: "guides.items.caregivers.title",
        descriptionKey: "guides.items.caregivers.description",
        contentKey: "guides.items.caregivers.content",
        requires: "caregiverSharing",
        color: "from-rose-500 to-rose-600",
        bgColor: "bg-rose-500/10",
      },
      {
        icon: Shield,
        titleKey: "guides.items.privacy.title",
        descriptionKey: "guides.items.privacy.description",
        href: "/legal/privacy",
        color: "from-gray-500 to-gray-600",
        bgColor: "bg-gray-500/10",
      },
    ],
  },
];

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown parser for basic formatting
  const parseContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let currentListType: "ul" | "ol" | null = null;
    let key = 0;

    const flushList = () => {
      if (currentList.length > 0 && currentListType) {
        const ListTag = currentListType === "ol" ? "ol" : "ul";
        const listClass =
          currentListType === "ol"
            ? "text-muted-foreground mb-3 list-decimal space-y-1 pl-6 text-sm"
            : "text-muted-foreground mb-3 list-disc space-y-1 pl-6 text-sm";

        elements.push(
          <ListTag key={key++} className={listClass}>
            {currentList.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {parseInlineFormatting(item)}
              </li>
            ))}
          </ListTag>,
        );
        currentList = [];
        currentListType = null;
      }
    };

    const parseInlineFormatting = (text: string): React.ReactNode => {
      // Parse bold **text**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        flushList();
        continue;
      }

      // Heading ##
      if (trimmedLine.startsWith("## ")) {
        flushList();
        elements.push(
          <h3
            key={key++}
            className="text-foreground mt-6 mb-3 text-base font-semibold first:mt-0"
          >
            {trimmedLine.slice(3)}
          </h3>,
        );
        continue;
      }

      // Unordered list item
      if (trimmedLine.startsWith("- ")) {
        if (currentListType !== "ul") {
          flushList();
          currentListType = "ul";
        }
        currentList.push(trimmedLine.slice(2));
        continue;
      }

      // Ordered list item
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        if (currentListType !== "ol") {
          flushList();
          currentListType = "ol";
        }
        currentList.push(orderedMatch[2]);
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-muted-foreground mb-3 text-sm leading-relaxed"
        >
          {parseInlineFormatting(trimmedLine)}
        </p>,
      );
    }

    flushList();
    return elements;
  };

  return <div className="space-y-0">{parseContent(content)}</div>;
}

export default async function GuidesPage() {
  const { t } = await getI18n();
  const featureAvailability = {
    caregiverSharing: getFeatureAvailability("caregiverSharing").enabled,
  };
  const availableGuideCategories = guideCategories.map((category) => ({
    ...category,
    guides: category.guides.filter(
      (guide) =>
        !guide.requires || featureAvailability[guide.requires] === true,
    ),
  }));

  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />

      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <BookOpen className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("guides.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("guides.description")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Guides by Category with Accordion */}
      <SectionLayout size="lg" variant="transparent">
        <div className="mx-auto max-w-4xl space-y-12">
          {availableGuideCategories.map((category) => (
            <div key={category.titleKey}>
              {/* Category Header */}
              <div className="mb-6">
                <Typography
                  variant="h2"
                  className="text-foreground text-2xl font-bold"
                >
                  {t(category.titleKey)}
                </Typography>
                <Typography
                  variant="p"
                  className="text-muted-foreground mt-1 text-sm"
                >
                  {t(category.descriptionKey)}
                </Typography>
              </div>

              {/* Guides Accordion */}
              <Accordion type="multiple" className="space-y-4">
                {category.guides.map((guide) => {
                  const Icon = guide.icon;
                  const title = t(guide.titleKey);
                  const description = t(guide.descriptionKey);
                  const content = guide.contentKey ? t(guide.contentKey) : null;

                  // If it has an href (like privacy), render as a link instead
                  if (guide.href) {
                    return (
                      <Link
                        key={guide.titleKey}
                        href={guide.href}
                        className="border-border bg-card hover:border-primary/30 group relative block overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg"
                      >
                        <div
                          className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-50 blur-2xl ${guide.bgColor}`}
                        />
                        <div className="relative flex items-start gap-4">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${guide.color} text-white shadow-lg transition-transform group-hover:scale-110`}
                          >
                            <Icon className="size-6" />
                          </div>
                          <div className="flex-1">
                            <Typography
                              variant="h3"
                              className="text-foreground text-lg font-semibold"
                            >
                              {title}
                            </Typography>
                            <Typography
                              variant="p"
                              className="text-muted-foreground mt-1 text-sm"
                            >
                              {description}
                            </Typography>
                            <div className="text-primary mt-3 flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                              {t("guides.readMore")}
                              <ArrowRight className="size-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <AccordionItem
                      key={guide.titleKey}
                      value={guide.titleKey}
                      className="border-border bg-card relative overflow-hidden rounded-2xl border"
                    >
                      <div
                        className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-50 blur-2xl ${guide.bgColor}`}
                      />
                      <AccordionTrigger className="relative px-6 py-4 hover:no-underline">
                        <div className="flex items-start gap-4 text-left">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${guide.color} text-white shadow-lg`}
                          >
                            <Icon className="size-6" />
                          </div>
                          <div className="flex-1 pr-4">
                            <Typography
                              variant="h3"
                              className="text-foreground text-lg font-semibold"
                            >
                              {title}
                            </Typography>
                            <Typography
                              variant="p"
                              className="text-muted-foreground mt-1 text-sm"
                            >
                              {description}
                            </Typography>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="relative px-6 pb-6">
                        <div className="border-border ml-16 border-t pt-4">
                          {content && <MarkdownContent content={content} />}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))}
        </div>
      </SectionLayout>

      {/* CTA Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl">
          <div className="border-border bg-card rounded-2xl border p-8 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <Sparkles className="text-primary size-6" />
            </div>
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              {t("guides.cta.title")}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mb-4 text-sm"
            >
              {t("guides.cta.description")}
            </Typography>
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-colors"
            >
              {t("guides.cta.button")}
            </Link>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}
