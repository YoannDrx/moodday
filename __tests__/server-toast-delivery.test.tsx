import { act, render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { toast } from "sonner";
import { ServerToaster } from "@/features/server-sonner/server-toaster";
import { ClientToasts } from "@/features/server-sonner/client-toast";
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
it("discards corrupt toast cookies and deletes the delivered cookie on dismissal", async () => {
  const remove = vi.fn();
  vi.mocked(cookies).mockResolvedValue({
    getAll: () => [
      { name: "session", value: "private" },
      { name: "toast-empty", value: "" },
      { name: "toast-json", value: "bad-json" },
      { name: "toast-schema", value: "{}" },
      {
        name: "toast-ok",
        value: JSON.stringify({ message: "Saved", type: "success" }),
      },
    ],
    delete: remove,
  } as never);
  const component = await ServerToaster();
  expect(component.props.toasts).toHaveLength(1);
  expect(component.props.toasts[0].message).toBe("Saved");
  await component.props.toasts[0].dismiss();
  expect(remove).toHaveBeenCalledWith("toast-ok");
});
it.each(["onDismiss", "onAutoClose"] as const)(
  "delivers once and acknowledges %s",
  async (event) => {
    vi.mocked(toast).mockClear();
    const dismiss = vi.fn().mockResolvedValue(undefined);
    const toasts = [
      {
        id: "toast-saved",
        type: "success" as const,
        message: "Saved",
        dismiss,
      },
    ];
    const view = render(<ClientToasts toasts={toasts} />);
    view.rerender(<ClientToasts toasts={toasts} />);
    expect(toast).toHaveBeenCalledOnce();
    const options = vi.mocked(toast).mock.calls[0][1];
    await act(async () => {
      (options?.[event] as () => void)();
    });
    expect(dismiss).toHaveBeenCalledOnce();
  },
);
