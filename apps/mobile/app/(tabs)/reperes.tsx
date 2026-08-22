import { color, space } from "@moodday/design-tokens";
import { StyleSheet, Text, View } from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";

export default function ReperesScreen() {
  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>COMPRENDRE SANS CONCLURE</Text>
          <Text style={styles.title}>Repères</Text>
        </View>
        <BrandIllustration variant="landmarks" style={styles.visual} />
      </View>
      <SectionCard
        eyebrow="Piste à confirmer"
        title="Les jours suivant un sommeil plus long, ton énergie est souvent plus élevée."
        description="Association positive · 18 jours comparables · couverture 72 %. Ce repère ne prouve pas une cause."
      />
      <SectionCard
        title="Cette semaine"
        description="3 points du jour, 6 prises renseignées et un rendez-vous préparé. Pas de série à maintenir."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space[2] },
  headingCopy: { gap: space[2] },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: color.ink, fontSize: 38, lineHeight: 44, fontWeight: "700" },
  visual: { alignSelf: "center", width: 280, height: 126 },
});
