import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "dark" }) }));
vi.mock("sonner", () => ({
  Toaster: (props: { theme?: string; className?: string }) => (
    <div data-testid="sonner" data-theme={props.theme} className={props.className} />
  ),
}));

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { buttonVariants } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InlineTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toggle, toggleVariants } from "@/components/ui/toggle";

describe("complete UI primitives", () => {
  it("gives outline buttons an explicit foreground color", () => {
    expect(buttonVariants({ variant: "outline" })).toContain("text-foreground");
  });

  it("renders an interactive calendar with dropdown and custom day classes", () => {
    render(
      <Calendar
        mode="single"
        month={new Date(2026, 7, 1)}
        selected={new Date(2026, 7, 13)}
        captionLayout="dropdown"
        showWeekNumber
        className="calendar-test"
      />,
    );
    expect(document.querySelector('[data-slot="calendar"]')).toHaveClass(
      "calendar-test",
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /13/ })).toHaveAttribute(
      "data-selected-single",
      "true",
    );
  });

  it("opens select, dialog, sheet and popover overlays", () => {
    const view = render(
      <Select defaultValue="fr" open>
        <SelectTrigger size="sm" aria-label="language">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectGroup>
            <SelectLabel>Locale</SelectLabel>
            <SelectItem value="fr">Français</SelectItem>
            <SelectSeparator />
            <SelectItem value="en">English</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    expect(screen.getAllByText("Français")).toHaveLength(2);

    view.rerender(
      <Dialog open>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeInTheDocument();

    view.rerender(
      <Sheet open>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Sheet title" })).toBeInTheDocument();

    view.rerender(
      <Popover open>
        <PopoverAnchor>Anchor</PopoverAnchor>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent align="start">Popover content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Popover content")).toBeInTheDocument();
  });

  it("renders commands, tabs, collapse, choices and value controls", () => {
    const onCheckedChange = vi.fn();
    const view = render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>Nothing</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem value="open">
              Open <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>,
    );
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "open" },
    });
    expect(screen.getByText("Open")).toBeInTheDocument();

    view.rerender(
      <CommandDialog open title="Palette" description="Find a command">
        <CommandInput placeholder="Command search" />
      </CommandDialog>,
    );
    expect(screen.getByRole("dialog", { name: "Palette" })).toBeInTheDocument();

    view.rerender(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>,
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Second panel")).toBeInTheDocument();

    view.rerender(
      <div>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle details</CollapsibleTrigger>
          <CollapsibleContent>Details</CollapsibleContent>
        </Collapsible>
        <RadioGroup defaultValue="daily" aria-label="frequency">
          <RadioGroupItem value="daily" aria-label="daily" />
          <RadioGroupItem value="weekly" aria-label="weekly" />
        </RadioGroup>
        <Slider defaultValue={[25, 75]} aria-label="range" />
        <Switch aria-label="notifications" onCheckedChange={onCheckedChange} />
        <Toggle variant="outline" size="lg" aria-label="favorite">
          Favorite
        </Toggle>
      </div>,
    );
    fireEvent.click(screen.getByRole("switch", { name: "notifications" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(toggleVariants({ size: "sm" })).toContain("h-8");
  });

  it("composes alerts, breadcrumbs, tables and pagination semantics", () => {
    render(
      <div>
        <Alert variant="success">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Your changes are safe.</AlertDescription>
        </Alert>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button type="button">Journal</button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>→</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Entry</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
        <Table>
          <TableCaption>Mood entries</TableCaption>
          <TableHeader>
            <TableRow><TableHead>Date</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>13 August</TableCell></TableRow>
          </TableBody>
          <TableFooter>
            <TableRow><TableCell>Total: 1</TableCell></TableRow>
          </TableFooter>
        </Table>
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
            <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Saved");
    expect(screen.getByRole("table")).toHaveAccessibleName("Mood entries");
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders aspect ratio, tooltips and the theme-aware toaster", () => {
    render(
      <div>
        <AspectRatio ratio={16 / 9}>Media</AspectRatio>
        <TooltipProvider delayDuration={10}>
          <Tooltip open>
            <TooltipTrigger>Help</TooltipTrigger>
            <TooltipContent sideOffset={4}>Tooltip details</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <InlineTooltip title="Inline details">
          <button type="button">Info</button>
        </InlineTooltip>
        <Toaster position="top-center" />
      </div>,
    );
    expect(screen.getAllByText("Tooltip details").length).toBeGreaterThan(0);
    expect(screen.getByTestId("sonner")).toHaveAttribute("data-theme", "dark");
  });
});
