import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: () => <div>chart-tooltip-primitive</div>,
  Legend: () => <div>chart-legend-primitive</div>,
}));

vi.mock("@radix-ui/react-dropdown-menu", () => {
  const simplePrimitive = (slot: string) => {
    const Primitive = ({
      children,
      sideOffset: _sideOffset,
      ...props
    }: React.ComponentProps<"div"> & { sideOffset?: number }) => (
      <div data-primitive={slot} {...props}>
        {children}
      </div>
    );
    Primitive.displayName = slot;
    return Primitive;
  };

  return {
    Root: simplePrimitive("root"),
    Portal: simplePrimitive("portal"),
    Trigger: simplePrimitive("trigger"),
    Content: simplePrimitive("content"),
    Group: simplePrimitive("group"),
    Item: simplePrimitive("item"),
    CheckboxItem: simplePrimitive("checkbox-item"),
    ItemIndicator: simplePrimitive("indicator"),
    RadioGroup: simplePrimitive("radio-group"),
    RadioItem: simplePrimitive("radio-item"),
    Label: simplePrimitive("label"),
    Separator: simplePrimitive("separator"),
    Sub: simplePrimitive("sub"),
    SubTrigger: simplePrimitive("sub-trigger"),
    SubContent: simplePrimitive("sub-content"),
  };
});

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";

const DotIcon = () => <svg aria-label="configured-icon" />;
const config = {
  mood: { label: "Humeur", color: "#123456" },
  energy: {
    label: "Énergie",
    theme: { light: "#abcdef", dark: "#fedcba" },
    icon: DotIcon,
  },
};

describe("extended UI primitives", () => {
  it("renders chart CSS, tooltip formats and legend variants", () => {
    render(
      <ChartContainer id="mood" config={config}>
        <div>chart-child</div>
      </ChartContainer>,
    );
    expect(screen.getByText("chart-child")).toBeInTheDocument();
    expect(document.querySelector("style")?.textContent).toContain(
      "--color-mood: #123456",
    );

    const payload = [
      {
        dataKey: "mood",
        name: "mood",
        value: 0,
        color: "#123456",
        payload: { fill: "#654321" },
      },
      {
        dataKey: "energy",
        name: "energy",
        value: 12,
        color: "#abcdef",
        payload: {},
      },
    ];
    const view = render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} label="mood" />
      </ChartContainer>,
    );
    expect(screen.getAllByText("Humeur")).toHaveLength(2);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByLabelText("configured-icon")).toBeInTheDocument();

    view.rerender(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          payload={payload.slice(0, 1)}
          indicator="dashed"
          labelFormatter={(value) => `formatted:${String(value)}`}
        />
      </ChartContainer>,
    );
    expect(screen.getByText(/formatted:Humeur/)).toBeInTheDocument();
    view.rerender(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          payload={payload.slice(0, 1)}
          formatter={(value, name) => (
            <span>{`${String(name)}=${String(value)}`}</span>
          )}
        />
      </ChartContainer>,
    );
    expect(screen.getByText("mood=0")).toBeInTheDocument();

    view.rerender(
      <ChartContainer config={config}>
        <ChartLegendContent
          verticalAlign="top"
          payload={[
            {
              value: "Mood",
              dataKey: "mood",
              color: "#123456",
              type: "circle",
            },
            {
              value: "Energy",
              dataKey: "energy",
              color: "#abcdef",
              type: "circle",
            },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText("Humeur")).toBeInTheDocument();
    expect(screen.getByText("Énergie")).toBeInTheDocument();
    expect(ChartTooltip).toBeTypeOf("function");
    expect(ChartLegend).toBeTypeOf("function");
  });

  it("handles empty chart config and rejects context-free content", () => {
    const view = render(<ChartStyle id="empty" config={{ none: {} }} />);
    expect(view.container).toBeEmptyDOMElement();
    expect(() => render(<ChartTooltipContent active payload={[]} />)).toThrow(
      "useChart must be used within a <ChartContainer />",
    );
  });

  it("mounts every dropdown wrapper and variant", () => {
    render(
      <DropdownMenu>
        <DropdownMenuPortal>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel inset>Label</DropdownMenuLabel>
              <DropdownMenuItem inset variant="destructive">
                Delete
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem checked>
                Checked
              </DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup>
                <DropdownMenuRadioItem value="one">Radio</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>Nested</DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>,
    );
    expect(screen.getByText("Delete")).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    expect(screen.getByText("Checked")).toBeInTheDocument();
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("composes item layouts, variants and Slot children", () => {
    render(
      <ItemGroup className="custom-group">
        <Item variant="outline" size="sm">
          <ItemMedia variant="icon">M</ItemMedia>
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Title</ItemTitle>
              <ItemActions>Action</ItemActions>
            </ItemHeader>
            <ItemDescription>Description</ItemDescription>
            <ItemFooter>Footer</ItemFooter>
          </ItemContent>
        </Item>
        <ItemSeparator />
        <Item asChild variant="muted">
          <button type="button">Slotted item</button>
        </Item>
      </ItemGroup>,
    );
    expect(screen.getByRole("list")).toHaveClass("custom-group");
    expect(
      screen.getByText("Title").closest('[data-slot="item"]'),
    ).toHaveAttribute("data-variant", "outline");
    expect(
      screen.getByRole("button", { name: "Slotted item" }),
    ).toHaveAttribute("data-slot", "item");
  });

  it("focuses input-group controls without stealing button clicks", () => {
    render(
      <>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>€</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="amount" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs">Go</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon align="block-start">Note</InputGroupAddon>
          <InputGroupTextarea aria-label="note" />
          <InputGroupAddon align="block-end">End</InputGroupAddon>
        </InputGroup>
      </>,
    );
    fireEvent.click(screen.getByText("€"));
    expect(screen.getByLabelText("amount")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByLabelText("note")).not.toHaveFocus();
    expect(screen.getByText("End")).toHaveAttribute("data-align", "block-end");
  });
});
