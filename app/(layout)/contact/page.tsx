import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSupportAction } from "@/features/contact/support/contact-support.action";
import { ContactSupportSchema } from "@/features/contact/support/contact-support.schema";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { serverToast } from "@/lib/server-toast";
import { SiteConfig } from "@/site-config";
import {
  Mail,
  MessageSquare,
  Clock,
  Send,
  HelpCircle,
  Twitter,
  Linkedin,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("contact.metaTitle", { app: SiteConfig.title }),
    description: t("contact.metaDescription"),
    keywords: ["contact", "support", "help", "testimonials", "questions"],
    openGraph: {
      title: t("contact.metaTitle", { app: SiteConfig.title }),
      description: t("contact.metaDescription"),
      url: `${SiteConfig.prodUrl}/contact`,
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const { t } = await getI18n();

  return (
    <div className="bg-background relative isolate min-h-screen">
      <GridBackground
        size={20}
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
      />

      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <Mail className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("contact.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("contact.description")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Contact Options */}
      <SectionLayout size="lg" variant="transparent" className="pt-0 lg:pt-0">
        <div className="mx-auto max-w-5xl">
          {/* Contact Cards */}
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {/* Email Card */}
            <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-6 transition-all hover:shadow-lg">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Mail className="size-6 text-blue-500" />
              </div>
              <Typography
                variant="h3"
                className="text-foreground mb-2 font-bold"
              >
                {t("contact.cards.email.title")}
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground mb-4 text-sm"
              >
                {t("contact.cards.email.description")}
              </Typography>
              <a
                href="mailto:hello@moodday.app"
                className="text-primary text-sm font-semibold hover:underline"
              >
                hello@moodday.app
              </a>
            </div>

            {/* Response Time Card */}
            <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-6 transition-all hover:shadow-lg">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Clock className="size-6 text-emerald-500" />
              </div>
              <Typography
                variant="h3"
                className="text-foreground mb-2 font-bold"
              >
                {t("contact.cards.response.title")}
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground mb-4 text-sm"
              >
                {t("contact.cards.response.description")}
              </Typography>
              <span className="text-foreground text-sm font-semibold">
                {t("contact.cards.response.value")}
              </span>
            </div>

            {/* Social Card */}
            <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-6 transition-all hover:shadow-lg">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-violet-500/10">
                <MessageSquare className="size-6 text-violet-500" />
              </div>
              <Typography
                variant="h3"
                className="text-foreground mb-2 font-bold"
              >
                {t("contact.cards.social.title")}
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground mb-4 text-sm"
              >
                {t("contact.cards.social.description")}
              </Typography>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="bg-muted hover:bg-muted/80 flex size-9 items-center justify-center rounded-lg transition-colors"
                >
                  <Twitter className="text-muted-foreground size-4" />
                </a>
                <a
                  href="#"
                  className="bg-muted hover:bg-muted/80 flex size-9 items-center justify-center rounded-lg transition-colors"
                >
                  <Linkedin className="text-muted-foreground size-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="border-border bg-card rounded-2xl border p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                    <Send className="text-primary size-5" />
                  </div>
                  <div>
                    <Typography
                      variant="h2"
                      className="text-foreground text-xl font-bold"
                    >
                      {t("contact.form.title")}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground text-sm"
                    >
                      {t("contact.form.subtitle")}
                    </Typography>
                  </div>
                </div>

                <form
                  action={async (formData) => {
                    "use server";
                    const { t } = await getI18n();

                    const firstname = formData.get("first-name");
                    const lastname = formData.get("last-name");
                    const email = formData.get("email");
                    const subject = formData.get("subject");
                    const message = formData.get("message");

                    const result = ContactSupportSchema.safeParse({
                      firstname,
                      lastname,
                      email,
                      subject,
                      message,
                    });

                    if (!result.success) {
                      await serverToast(t("contact.form.invalid"), "error");
                      return;
                    }

                    await contactSupportAction(result.data);

                    await serverToast(t("contact.form.success"), "success");
                  }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="first-name"
                        className="text-foreground block text-sm font-semibold"
                      >
                        {t("contact.form.firstName")}
                      </Label>
                      <div className="mt-2">
                        <Input
                          id="first-name"
                          name="first-name"
                          type="text"
                          autoComplete="given-name"
                          className="block w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="last-name"
                        className="text-foreground block text-sm font-semibold"
                      >
                        {t("contact.form.lastName")}
                      </Label>
                      <div className="mt-2">
                        <Input
                          id="last-name"
                          name="last-name"
                          type="text"
                          autoComplete="family-name"
                          className="block w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-foreground block text-sm font-semibold"
                    >
                      {t("contact.form.email")}
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="block w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="subject"
                      className="text-foreground block text-sm font-semibold"
                    >
                      {t("contact.form.subject")}
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        className="block w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="message"
                      className="text-foreground block text-sm font-semibold"
                    >
                      {t("contact.form.message")}
                    </Label>
                    <div className="mt-2">
                      <Textarea
                        id="message"
                        name="message"
                        rows={5}
                        className="block w-full"
                        defaultValue={""}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-lg py-3 text-center font-semibold sm:w-auto sm:px-8"
                  >
                    {t("contact.form.submit")}
                  </Button>
                </form>
              </div>
            </div>

            {/* FAQ Sidebar */}
            <div className="lg:col-span-2">
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                    <HelpCircle className="text-primary size-5" />
                  </div>
                  <Typography
                    variant="h3"
                    className="text-foreground font-bold"
                  >
                    {t("contact.faq.title")}
                  </Typography>
                </div>

                <div className="space-y-4">
                  <div className="border-border rounded-lg border p-4">
                    <Typography
                      variant="p"
                      className="text-foreground mb-1 text-sm font-semibold"
                    >
                      {t("contact.faq.items.free.question")}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground text-sm"
                    >
                      {t("contact.faq.items.free.answer")}
                    </Typography>
                  </div>

                  <div className="border-border rounded-lg border p-4">
                    <Typography
                      variant="p"
                      className="text-foreground mb-1 text-sm font-semibold"
                    >
                      {t("contact.faq.items.security.question")}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground text-sm"
                    >
                      {t("contact.faq.items.security.answer")}
                    </Typography>
                  </div>

                  <div className="border-border rounded-lg border p-4">
                    <Typography
                      variant="p"
                      className="text-foreground mb-1 text-sm font-semibold"
                    >
                      {t("contact.faq.items.export.question")}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground text-sm"
                    >
                      {t("contact.faq.items.export.answer")}
                    </Typography>
                  </div>
                </div>

                <Link
                  href="/#faq"
                  className="text-primary mt-4 block text-center text-sm font-semibold hover:underline"
                >
                  {t("contact.faq.more")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}
