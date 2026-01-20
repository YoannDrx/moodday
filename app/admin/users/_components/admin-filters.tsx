"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n } from "@/i18n/provider";
import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { adminSearchParams } from "../_actions/search-params";

export const AdminFilters = () => {
  const { t } = useI18n();
  const [filters, setFilters] = useQueryStates(adminSearchParams, {
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
          placeholder={t("admin.users.searchPlaceholder")}
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
