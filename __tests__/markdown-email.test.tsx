import { render } from "react-email";
import { describe, expect, it } from "vitest";
import MarkdownEmail from "@email/markdown.email";

describe("markdown email", () => {
  it("renders immutable props without mutating the caller payload", async () => {
    const props = Object.freeze({
      markdown: "# Invitation\n\nBienvenue dans Moodday.",
      preview: "Invitation Moodday",
    });

    const html = await render(<MarkdownEmail {...props} />);

    expect(html).toContain("Invitation Moodday");
    expect(html).toContain("Bienvenue dans Moodday.");
    expect(html).toContain("Moodday");
    expect(props.markdown).toBe("# Invitation\n\nBienvenue dans Moodday.");
  });
});
