import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ mobile: false }));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => state.mobile,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => (
    <div data-testid="sheet" data-open={String(open)}>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    side,
  }: {
    children: React.ReactNode;
    side: string;
  }) => (
    <aside data-testid="sheet-content" data-side={side}>
      {children}
    </aside>
  ),
  SheetDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({
    children,
    hidden,
  }: {
    children: React.ReactNode;
    hidden?: boolean;
  }) => (
    <span data-testid="tooltip" data-hidden={String(hidden)}>
      {children}
    </span>
  ),
}));

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

function SidebarState() {
  const sidebar = useSidebar();
  return (
    <output data-testid="sidebar-state">
      {sidebar.state}:{String(sidebar.openMobile)}
    </output>
  );
}

const SidebarTree = () => (
  <>
    <Sidebar side="right" variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarInput aria-label="search" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Group</SidebarGroupLabel>
          <SidebarGroupAction type="button">+</SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  variant="outline"
                  size="lg"
                  tooltip="Tooltip"
                >
                  Menu
                </SidebarMenuButton>
                <SidebarMenuAction showOnHover type="button">
                  Action
                </SidebarMenuAction>
                <SidebarMenuBadge>3</SidebarMenuBadge>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#details" size="sm" isActive>
                      Submenu
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenuSkeleton showIcon />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>Footer</SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset>Inset</SidebarInset>
    <SidebarState />
    <SidebarTrigger />
  </>
);

describe("sidebar component system", () => {
  beforeEach(() => {
    state.mobile = false;
    document.cookie = "sidebar_state=true; path=/";
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  it("requires a provider", () => {
    expect(() => render(<SidebarState />)).toThrow(
      "useSidebar must be used within a SidebarProvider.",
    );
  });

  it("mounts all desktop regions and toggles through pointer and keyboard", () => {
    const onTrigger = vi.fn();
    render(
      <SidebarProvider className="provider">
        <SidebarTree />
        <SidebarTrigger onClick={onTrigger} aria-label="secondary-trigger" />
      </SidebarProvider>,
    );
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent(
      "expanded:false",
    );
    expect(screen.getByText("Menu")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tooltip")).toHaveAttribute(
      "data-hidden",
      "true",
    );
    expect(screen.getByLabelText("search")).toBeInTheDocument();
    expect(
      document.querySelector('[data-sidebar="menu-skeleton-text"]'),
    ).toHaveStyle("--skeleton-width: 70%");

    fireEvent.click(screen.getByLabelText("secondary-trigger"));
    expect(onTrigger).toHaveBeenCalled();
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent(
      "collapsed:false",
    );
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent(
      "expanded:false",
    );
    fireEvent.click(screen.getByTitle("sidebar.toggle"));
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent(
      "collapsed:false",
    );
  });

  it("supports controlled state and a permanently visible sidebar", () => {
    const onOpenChange = vi.fn();
    render(
      <SidebarProvider open={false} onOpenChange={onOpenChange}>
        <Sidebar collapsible="none">Always visible</Sidebar>
        <SidebarTrigger />
        <SidebarState />
      </SidebarProvider>,
    );
    expect(screen.getByText("Always visible")).toHaveAttribute(
      "data-slot",
      "sidebar",
    );
    fireEvent.click(screen.getByRole("button", { name: "sidebar.toggle" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.cookie).toContain("sidebar_state=true");
  });

  it("uses the mobile sheet and toggles its independent state", () => {
    state.mobile = true;
    render(
      <SidebarProvider>
        <Sidebar side="right">Mobile content</Sidebar>
        <SidebarTrigger />
        <SidebarState />
      </SidebarProvider>,
    );
    expect(screen.getByTestId("sheet")).toHaveAttribute("data-open", "false");
    expect(screen.getByTestId("sheet-content")).toHaveAttribute(
      "data-side",
      "right",
    );
    fireEvent.click(screen.getByRole("button", { name: "sidebar.toggle" }));
    expect(screen.getByTestId("sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent(
      "expanded:true",
    );
  });
});
