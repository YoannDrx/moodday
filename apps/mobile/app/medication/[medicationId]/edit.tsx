import { useLocalSearchParams } from "expo-router";
import { MedicationFormScreen } from "../../../src/components/medication-form-screen";

export default function EditMedicationScreen() {
  const { medicationId } = useLocalSearchParams<{ medicationId: string }>();
  return <MedicationFormScreen medicationId={medicationId} />;
}
