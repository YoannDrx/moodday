import { radius, space, sticker } from "@moodday/design-tokens";
import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { inkOnFill, usePalette, type Palette } from "../lib/theme";

// ─── Text ─────────────────────────────────────────────────────────────────

type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "small"
  | "eyebrow";
type TextTone = "default" | "muted" | "danger" | "ink" | "inverse";

const textStyles = StyleSheet.create({
  display: { fontSize: 34, lineHeight: 40, fontWeight: "800" },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "800" },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

const toneColor = (palette: Palette, tone: TextTone) =>
  tone === "muted"
    ? palette.inkMuted
    : tone === "danger"
      ? palette.danger
      : tone === "ink"
        ? inkOnFill
        : tone === "inverse"
          ? palette.onPrimary
          : palette.ink;

export function Txt({
  variant = "body",
  tone = "default",
  style,
  ...props
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const palette = usePalette();
  return (
    <Text
      {...props}
      style={[textStyles[variant], { color: toneColor(palette, tone) }, style]}
    />
  );
}

// ─── Sticker card ─────────────────────────────────────────────────────────

export type Fill =
  | "surface"
  | "honey"
  | "mint"
  | "apricot"
  | "plum"
  | "ink"
  | "canvas";

const fillColor = (palette: Palette, fill: Fill) =>
  ({
    surface: palette.surfaceStrong,
    canvas: palette.canvas,
    honey: palette.honeySoft,
    mint: palette.mintSoft,
    apricot: palette.apricotSoft,
    plum: palette.plumSoft,
    ink: palette.primaryDeep,
  })[fill];

/**
 * The "Chaud devant" sticker: thick ink outline and a hard offset shadow,
 * drawn as a second shape so it renders the same on iOS and Android.
 */
export function Sticker({
  children,
  fill = "surface",
  background,
  style,
  shadow = true,
  testID,
}: PropsWithChildren<{
  fill?: Fill;
  background?: string;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
  testID?: string;
}>) {
  const palette = usePalette();
  return (
    <View testID={testID} style={shadow ? styles.stickerFrame : undefined}>
      {shadow ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.stickerShadow, { backgroundColor: palette.border }]}
        />
      ) : null}
      <View
        style={[
          styles.sticker,
          {
            borderColor: palette.border,
            backgroundColor: background ?? fillColor(palette, fill),
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function Card({
  title,
  eyebrow,
  children,
  fill,
  testID,
}: PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  fill?: Fill;
  testID?: string;
}>) {
  const inverse = fill === "ink";
  return (
    <Sticker fill={fill} testID={testID}>
      {eyebrow ? (
        <Txt variant="eyebrow" tone={inverse ? "inverse" : "muted"}>
          {eyebrow}
        </Txt>
      ) : null}
      {title ? (
        <Txt
          variant="heading"
          tone={inverse ? "inverse" : "default"}
          accessibilityRole="header"
        >
          {title}
        </Txt>
      ) : null}
      {children}
    </Sticker>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────

type ButtonVariant =
  | "primary"
  | "honey"
  | "mint"
  | "outline"
  | "ghost"
  | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  pending = false,
  accessibilityLabel,
  testID,
  trailing,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  pending?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  trailing?: string;
  compact?: boolean;
}) {
  const palette = usePalette();
  const inactive = disabled || pending;
  const background =
    variant === "primary"
      ? palette.primary
      : variant === "honey"
        ? palette.honey
        : variant === "mint"
          ? palette.mint
          : variant === "danger"
            ? palette.dangerSoft
            : variant === "outline"
              ? palette.surfaceStrong
              : "transparent";
  const foreground =
    variant === "primary"
      ? palette.onPrimary
      : variant === "honey" || variant === "mint"
        ? inkOnFill
        : variant === "danger"
          ? palette.danger
          : palette.ink;
  const bordered = variant !== "ghost";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: pending }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: background,
          borderColor: variant === "danger" ? palette.danger : palette.border,
          borderWidth: bordered ? sticker.borderWidth : 0,
        },
        inactive && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {pending ? <ActivityIndicator color={foreground} /> : null}
      <Text
        style={[
          styles.buttonLabel,
          { color: foreground },
          variant === "ghost" && styles.ghostLabel,
        ]}
      >
        {label}
      </Text>
      {trailing ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.buttonLabel, { color: foreground }]}
        >
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** A toggle pill for symptoms, needs and onboarding choices. */
export function Chip({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: palette.border,
          backgroundColor: selected ? palette.honey : palette.surfaceStrong,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? inkOnFill : palette.ink },
        ]}
      >
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup({ children }: PropsWithChildren) {
  return <View style={styles.chipGroup}>{children}</View>;
}

/** A large selectable tile used for radio-like choices. */
export function ChoiceTile({
  title,
  description,
  selected,
  onPress,
  background,
  children,
  testID,
}: PropsWithChildren<{
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  background?: string;
  testID?: string;
}>) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.tile,
        {
          borderColor: palette.border,
          backgroundColor: selected
            ? (background ?? palette.honey)
            : palette.surfaceStrong,
        },
        selected && styles.tileSelected,
        pressed && styles.pressed,
      ]}
    >
      {children}
      <Text
        style={[
          styles.tileTitle,
          { color: selected ? inkOnFill : palette.ink },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            styles.tileDescription,
            { color: selected ? inkOnFill : palette.inkMuted },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── Form fields ──────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Txt variant="small" style={styles.fieldLabel}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={palette.inkMuted}
        {...props}
        style={[
          styles.input,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceStrong,
            color: palette.ink,
          },
          props.multiline && styles.multiline,
          style,
        ]}
      />
      {hint ? (
        <Txt variant="small" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  return (
    <View style={[styles.toggleRow, disabled && styles.disabled]}>
      <View style={styles.toggleText}>
        <Txt style={styles.bold}>{label}</Txt>
        {hint ? (
          <Txt variant="small" tone="muted">
            {hint}
          </Txt>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: palette.muted, true: palette.mint }}
        thumbColor={palette.surfaceStrong}
        ios_backgroundColor={palette.muted}
      />
    </View>
  );
}

/** Numeric stepper, used instead of a date or range picker dependency. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const palette = usePalette();
  const text = format ? format(value) : String(value);
  const step = (delta: -1 | 1) => {
    const blocked = delta < 0 ? value <= min : value >= max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${delta < 0 ? "Diminuer" : "Augmenter"} : ${label}`}
        disabled={blocked}
        onPress={() => onChange(value + delta)}
        style={({ pressed }) => [
          styles.stepperButton,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceStrong,
          },
          blocked && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.stepperGlyph, { color: palette.ink }]}>
          {delta < 0 ? "−" : "+"}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={styles.stepper}>
      <Txt style={[styles.bold, styles.flex]}>{label}</Txt>
      <View style={styles.stepperControls}>
        {step(-1)}
        <Txt
          accessibilityLiveRegion="polite"
          style={[styles.bold, styles.stepperValue]}
        >
          {text}
        </Txt>
        {step(1)}
      </View>
    </View>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────

/** Dashed mint box used for previews ("Tom verra : …"). */
export function Notice({ children }: PropsWithChildren) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.notice,
        { borderColor: palette.border, backgroundColor: palette.mintSoft },
      ]}
    >
      {typeof children === "string" ? (
        <Txt variant="small">{children}</Txt>
      ) : (
        children
      )}
    </View>
  );
}

export function StatusText({
  children,
  tone = "muted",
}: {
  children?: ReactNode;
  tone?: "muted" | "danger";
}) {
  if (!children) return null;
  return (
    <Txt
      variant="small"
      tone={tone}
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      accessibilityLiveRegion={tone === "danger" ? "assertive" : "polite"}
    >
      {children}
    </Txt>
  );
}

export function Row({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  stickerFrame: {
    marginRight: sticker.shadowOffset,
    marginBottom: sticker.shadowOffset,
  },
  stickerShadow: {
    position: "absolute",
    top: sticker.shadowOffset,
    left: sticker.shadowOffset,
    right: -sticker.shadowOffset,
    bottom: -sticker.shadowOffset,
    borderRadius: radius.large,
  },
  sticker: {
    gap: space[3],
    padding: space[5],
    borderRadius: radius.large,
    borderWidth: sticker.borderWidth,
  },
  button: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  buttonCompact: { minHeight: 44, paddingHorizontal: space[4] },
  buttonLabel: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  ghostLabel: { textDecorationLine: "underline" },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: sticker.borderWidth,
    borderRadius: radius.pill,
  },
  chipLabel: { fontSize: 14, fontWeight: "700" },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    gap: space[1],
    padding: space[3],
    borderWidth: sticker.borderWidth,
    borderRadius: radius.large,
  },
  tileSelected: { transform: [{ translateY: -2 }] },
  tileTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  tileDescription: { fontSize: 12, lineHeight: 16, textAlign: "center" },
  field: { gap: space[2] },
  fieldLabel: { fontWeight: "800" },
  input: {
    minHeight: 50,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.medium,
    borderWidth: sticker.borderWidth,
    fontSize: 16,
  },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  toggleRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  toggleText: { flex: 1, gap: space[1] },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: 56,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  stepperValue: { minWidth: 64, textAlign: "center" },
  stepperButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: sticker.borderWidth,
    borderRadius: radius.pill,
  },
  stepperGlyph: { fontSize: 22, fontWeight: "800" },
  notice: {
    padding: space[3],
    borderWidth: sticker.borderWidth,
    borderStyle: "dashed",
    borderRadius: radius.medium,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  bold: { fontWeight: "800" },
  flex: { flex: 1 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
