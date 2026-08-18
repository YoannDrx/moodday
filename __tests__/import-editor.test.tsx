import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  commit: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/features/import/import.action", () => ({
  previewMooddayImport: mocks.preview,
  commitMooddayImport: mocks.commit,
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import { ImportEditor } from "@app/(logged-in)/(patient-layout)/settings/import/import-editor";

const upload = (name: string, content: string, size = content.length) => {
  const file = { name, size, text: vi.fn().mockResolvedValue(content) } as unknown as File;
  fireEvent.change(screen.getByLabelText("JSON Moodday v2 ou CSV"), {
    target: { files: [file] },
  });
  return file;
};

describe("Moodday import editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preview.mockResolvedValue({
      data: {
        digest: "digest-1",
        validRows: 1,
        duplicateRows: 0,
        errors: [],
        sample: [{ rowNumber: 2, date: "2026-08-13", value: 7, tags: ["sleep", "walk"] }],
      },
    });
    mocks.commit.mockResolvedValue({ data: { importedRows: 1 } });
  });

  it("previews a CSV and commits exactly the reviewed digest", async () => {
    render(<ImportEditor />);
    upload("mood.csv", "date,value\n2026-08-13,7");
    await waitFor(() => expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Preview" })).toBeInTheDocument());
    expect(screen.getByText("sleep, walk")).toBeInTheDocument();
    expect(mocks.preview).toHaveBeenCalledWith({ format: "csv", content: "date,value\n2026-08-13,7" });

    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
    await waitFor(() => expect(mocks.commit).toHaveBeenCalledWith({
      format: "csv",
      content: "date,value\n2026-08-13,7",
      expectedDigest: "digest-1",
    }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("1 row(s) imported");
    expect(screen.queryByRole("heading", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("blocks oversized files and previews row-level validation errors", async () => {
    render(<ImportEditor />);
    upload("too-large.json", "{}", 1_000_001);
    expect(mocks.toastError).toHaveBeenCalledWith("File exceeds 1 MB");
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();

    mocks.preview.mockResolvedValueOnce({
      data: {
        digest: "digest-errors",
        validRows: 0,
        duplicateRows: 1,
        errors: [{ rowNumber: 4, code: "invalid_date" }],
        sample: [],
      },
    });
    upload("mood.json", "{\"version\":2}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByText("Ligne 4 : invalid_date")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  });

  it("surfaces preview and transactional import failures without clearing data", async () => {
    render(<ImportEditor />);
    upload("mood.json", "{\"version\":2}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled());
    mocks.preview.mockResolvedValueOnce({ serverError: "preview unavailable" });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("preview unavailable"));

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm import" })).toBeEnabled());
    mocks.commit.mockResolvedValueOnce({ serverError: "digest changed" });
    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("digest changed"));
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeInTheDocument();
  });
});
