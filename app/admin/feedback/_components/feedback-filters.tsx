"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n } from "@/i18n/provider";
import { Search } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const feedbackSearchParams = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
};

export const FeedbackFilters = () => {
  const { t } = useI18n();
  const [filters, setFilters] = useQueryStates(feedbackSearchParams, {
    shallow: false,
    throttleMs: 1000,
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <InputGroup className="flex-1">
        <InputGroupAddon align="inline-start">
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder={t("admin.feedback.searchPlaceholder")}
          value={filters.search}
          onChange={(e) => {
            void setFilters({
              search: e.target.value,
              page: 1,
            });
          }}
        />
      </InputGroup>
    </div>
  );
};
