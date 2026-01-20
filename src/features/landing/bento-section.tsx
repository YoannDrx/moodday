"use client";

import { BentoGrid, BentoGridItem } from "@/components/nowts/bentoo";
import { Loader } from "@/components/nowts/loader";
import { Typography } from "@/components/nowts/typography";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  CheckCircle,
  Sparkles,
  X,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { SectionLayout } from "./section-layout";

export function BentoGridSection() {
  const { t } = useI18n();
  const items = [
    {
      title: t("landing.bento.items.ai.title"),
      description: (
        <span className="text-sm">
          {t("landing.bento.items.ai.description")}
        </span>
      ),
      header: <Skeleton1 />,
      className: "md:col-span-1",
      icon: <Sparkles size={20} />,
    },
    {
      title: t("landing.bento.items.schedule.title"),
      description: (
        <span className="text-sm">
          {t("landing.bento.items.schedule.description")}
        </span>
      ),
      header: <Skeleton2 />,
      className: "md:col-span-1",
      icon: <Calendar size={20} />,
    },
    {
      title: t("landing.bento.items.calendar.title"),
      description: (
        <span className="text-sm">
          {t("landing.bento.items.calendar.description")}
        </span>
      ),
      header: <Skeleton3 />,
      className: "md:col-span-1",
      icon: <CalendarCheck size={20} />,
    },
    {
      title: t("landing.bento.items.analytics.title"),
      description: (
        <span className="text-sm">
          {t("landing.bento.items.analytics.description")}
        </span>
      ),
      header: <Skeleton4 />,
      className: "md:col-span-2",
      icon: <BarChart3 size={20} />,
    },
    {
      title: t("landing.bento.items.research.title"),
      description: (
        <span className="text-sm">
          {t("landing.bento.items.research.description")}
        </span>
      ),
      header: <Skeleton5 />,
      className: "md:col-span-1",
      icon: <X className="size-4 text-neutral-500" />,
    },
  ];

  return (
    <SectionLayout>
      <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn("[&>p:text-lg]", item.className)}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </SectionLayout>
  );
}

const Skeleton1 = () => {
  const { t } = useI18n();
  const variants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div className="border-border bg-background flex flex-row items-start gap-2 rounded-2xl border p-3">
        <img
          alt={t("landing.bento.avatarAlt")}
          src="https://melvynx.com/_next/image?url=%2Fimages%2Fmy-face.png&w=828&q=75"
          className="size-6 shrink-0 rounded-full"
        />
        <div>
          <p className="text-xs text-neutral-500">
            {t("landing.bento.skeleton.threadPrompt")}
          </p>
        </div>
      </motion.div>
      <motion.div
        variants={variants}
        className="border-border bg-background flex flex-row items-start justify-end gap-2 rounded-2xl border p-3"
      >
        <p className="text-xs text-neutral-500">
          {t("landing.bento.skeleton.threadResponse")}
        </p>
        <div className="size-6 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
      </motion.div>
    </motion.div>
  );
};

const Skeleton2 = () => {
  const { t } = useI18n();
  const variants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
  };
  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div>
        <Alert variant="default" className="">
          <Loader size={20} />
          <AlertTitle>{t("landing.bento.skeleton.schedulePending")}</AlertTitle>
        </Alert>
      </motion.div>
      <motion.div variants={variants}>
        <Alert variant="success" className="">
          <CheckCircle size={20} />
          <AlertTitle>{t("landing.bento.skeleton.scheduleSuccess")}</AlertTitle>
        </Alert>
      </motion.div>
    </motion.div>
  );
};
const Skeleton3 = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex size-full min-h-24 flex-1 flex-col space-y-2 rounded-lg"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="size-full rounded-lg"></motion.div>
    </motion.div>
  );
};
const Skeleton4 = () => {
  const { t } = useI18n();
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 flex-row gap-4"
    >
      <motion.div
        variants={first}
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">
          {t("landing.bento.stats.followers", { count: "123" })}
        </Typography>
        <Typography variant={"muted"}>
          {t("landing.bento.stats.last30Days")}
        </Typography>
        <Typography variant={"muted"} className="text-green-500">
          +12%
        </Typography>
      </motion.div>
      <motion.div className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4">
        <Typography variant="large">
          {t("landing.bento.stats.views", { count: "1.4 M" })}
        </Typography>
        <Typography variant={"muted"}>
          {t("landing.bento.stats.last30Days")}
        </Typography>
        <Typography variant={"muted"} className="text-green-500">
          +21%
        </Typography>
      </motion.div>
      <motion.div
        variants={second}
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">
          {t("landing.bento.stats.likes", { count: "1244" })}
        </Typography>
        <Typography variant="large">
          {t("landing.bento.stats.replies", { count: "766" })}
        </Typography>
        <Typography variant={"muted"}>
          {t("landing.bento.stats.last30Days")}
        </Typography>
        <Typography variant={"muted"} className="text-green-500">
          +12%
        </Typography>
      </motion.div>
    </motion.div>
  );
};

const Skeleton5 = () => {
  const { t } = useI18n();
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-col gap-2"
    >
      <motion.div
        variants={variants}
        className="border-border bg-background flex flex-row items-start gap-2 rounded-2xl border p-3"
      >
        <img
          src="https://melvynx.com/_next/image?url=%2Fimages%2Fmy-face.png&w=828&q=75"
          alt={t("landing.bento.avatarAlt")}
          height="100"
          width="100"
          className="size-10 rounded-full"
        />
        <p className="text-xs text-neutral-500">
          {t("landing.bento.skeleton.researchQuestion")}
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="border-border bg-background flex flex-row items-start justify-end gap-2 rounded-2xl border p-3"
      >
        <div>
          <p className="text-xs text-neutral-500">
            {t("landing.bento.skeleton.searching")}
          </p>
          <motion.p
            className="text-xs text-neutral-500"
            variants={{
              initial: {
                opacity: 0,
              },
              animate: {
                opacity: 1,
              },
            }}
          >
            {t("landing.bento.skeleton.researchAnswer")}
          </motion.p>
        </div>
        <div className="size-6 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
      </motion.div>
    </motion.div>
  );
};
