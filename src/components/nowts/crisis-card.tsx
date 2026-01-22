"use client";

import type { LucideIcon } from "lucide-react";
import { ExternalLink, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CrisisResource = {
  name: string;
  description?: string;
  phone?: string;
  url?: string;
  sms?: string;
  icon?: LucideIcon;
  available?: string; // e.g., "24/7", "9h-21h"
  category?: "hotline" | "chat" | "emergency" | "support";
};

type CrisisCardProps = {
  resource: CrisisResource;
  className?: string;
};

const categoryColors = {
  hotline: "border-red-500/50 bg-red-500/5",
  chat: "border-blue-500/50 bg-blue-500/5",
  emergency: "border-orange-500/50 bg-orange-500/5",
  support: "border-green-500/50 bg-green-500/5",
};

/**
 * CrisisCard - Display a crisis resource with contact info
 *
 * Shows phone numbers, URLs, SMS numbers for crisis hotlines and support services.
 */
export function CrisisCard({ resource, className }: CrisisCardProps) {
  const Icon = resource.icon ?? Phone;
  const category = resource.category ?? "support";

  return (
    <Card
      className={cn(
        "border-2 transition-shadow hover:shadow-md",
        categoryColors[category],
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-full p-2",
                category === "hotline" && "bg-red-500/10",
                category === "chat" && "bg-blue-500/10",
                category === "emergency" && "bg-orange-500/10",
                category === "support" && "bg-green-500/10",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  category === "hotline" && "text-red-500",
                  category === "chat" && "text-blue-500",
                  category === "emergency" && "text-orange-500",
                  category === "support" && "text-green-500",
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{resource.name}</CardTitle>
              {resource.available && (
                <p className="text-muted-foreground text-xs">
                  {resource.available}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {resource.description && (
          <p className="text-muted-foreground mb-4 text-sm">
            {resource.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {resource.phone && (
            <Button asChild variant="default" size="sm">
              <a href={`tel:${resource.phone}`}>
                <Phone className="mr-2 size-4" />
                {resource.phone}
              </a>
            </Button>
          )}

          {resource.sms && (
            <Button asChild variant="outline" size="sm">
              <a href={`sms:${resource.sms}`}>
                <MessageCircle className="mr-2 size-4" />
                SMS: {resource.sms}
              </a>
            </Button>
          )}

          {resource.url && (
            <Button asChild variant="outline" size="sm">
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Site web
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type CrisisCardListProps = {
  resources: CrisisResource[];
  className?: string;
};

export function CrisisCardList({ resources, className }: CrisisCardListProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {resources.map((resource, index) => (
        <CrisisCard key={index} resource={resource} />
      ))}
    </div>
  );
}
