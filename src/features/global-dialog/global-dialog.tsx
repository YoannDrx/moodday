"use client";

import dynamic from "next/dynamic";
import type { DialogType } from "./global-dialog.store";
import { useGlobalDialogStore } from "./global-dialog.store";

const UserDialogPlan = dynamic(
  async () =>
    import("./user-plan-dialog").then((mod) => ({
      default: mod.UserPlanDialog,
    })),
  { ssr: false },
);

const DialogTypeMap: Record<DialogType, React.ComponentType> = {
  "user-plan": UserDialogPlan,
};

/**
 * This component is used to display the global dialog.
 *
 * Example :
 *
 * Pricing table
 * User settings
 * ...
 *
 * If you want a Dialog that is displayable from anywhere without routing, you can use this component.
 *
 * @returns The dialog component to display
 */
export const GlobalDialog = () => {
  const dialogType = useGlobalDialogStore((state) => state.openDialog);

  if (!dialogType) {
    return null;
  }

  const DialogComponent = DialogTypeMap[dialogType];

  return <DialogComponent />;
};
