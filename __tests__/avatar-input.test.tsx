import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { NativeTargetBox } from "@/features/images/native-target-box";
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
afterEach(() => vi.useRealTimers());
it("forwards selected avatar files and shows drag feedback", async () => {
  vi.useFakeTimers();
  const onDrop = vi.fn();
  const view = render(
    <NativeTargetBox onDrop={onDrop} accept={["image/png", "image/jpeg"]} />,
  );
  const input = view.container.querySelector("input") as HTMLInputElement;
  expect(input.accept).toBe("image/png, image/jpeg");
  const png = new File(["fixture"], "avatar.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [png] } });
  expect(onDrop).toHaveBeenCalledWith({ files: [png] });
  fireEvent.dragOver(input);
  expect(screen.getByText("images.dropHere")).toBeVisible();
  fireEvent.dragLeave(input);
  expect(screen.getByText("images.upload")).toBeVisible();
  onDrop.mockClear();
  fireEvent.drop(input);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(onDrop).toHaveBeenCalledWith({ files: [png] });
});
it("reports an empty drop and ignores work after unmount", async () => {
  vi.useFakeTimers();
  const onDrop = vi.fn();
  const view = render(<NativeTargetBox onDrop={onDrop} />);
  const input = view.container.querySelector("input") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [] } });
  expect(onDrop).not.toHaveBeenCalled();
  fireEvent.drop(input);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(toast.error).toHaveBeenCalledWith("images.onlyAccept");
  fireEvent.drop(input);
  view.unmount();
  await vi.advanceTimersByTimeAsync(100);
  expect(onDrop).not.toHaveBeenCalled();
});
it("does not accept another drop while uploading", () => {
  const onDrop = vi.fn();
  const view = render(<NativeTargetBox onDrop={onDrop} isLoading />);
  const input = view.container.querySelector("input") as HTMLInputElement;
  fireEvent.dragOver(input);
  fireEvent.dragLeave(input);
  fireEvent.drop(input);
  expect(onDrop).not.toHaveBeenCalled();
  expect(screen.queryByText("images.dropHere")).toBeNull();
});
