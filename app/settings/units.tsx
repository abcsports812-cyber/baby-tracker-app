import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { useSettingsStore } from '../../src/store';
import { spacing } from '../../src/theme';

export default function UnitsSettingsScreen() {
  const weightUnit = useSettingsStore((s) => s.value.weightUnit);
  const heightUnit = useSettingsStore((s) => s.value.heightUnit);
  const patch = useSettingsStore((s) => s.patch);

  return (
    <Screen>
      <ModuleHeader illustration="growth" title="Units" subtitle="Used across growth & profile" />

      <Card style={{ marginBottom: spacing.lg }}>
        <ChipSelect
          label="Weight"
          value={weightUnit}
          onChange={(v) => patch({ weightUnit: v })}
          options={[
            { value: 'kg', label: 'Kilograms (kg)' },
            { value: 'lb', label: 'Pounds (lb)' },
          ]}
        />
      </Card>

      <Card>
        <ChipSelect
          label="Height"
          value={heightUnit}
          onChange={(v) => patch({ heightUnit: v })}
          options={[
            { value: 'cm', label: 'Centimeters (cm)' },
            { value: 'in', label: 'Inches (in)' },
          ]}
        />
      </Card>
    </Screen>
  );
}
