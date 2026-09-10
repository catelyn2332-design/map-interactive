import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { PropManager } from "@/components/atlas/prop-manager";

export const Route = createFileRoute("/parametres/proprietes")({
  component: ProprietesSettingsPage,
});

function ProprietesSettingsPage() {
  return (
    <SettingsShell title="Propriétés" titleId="properties">
      <PropManager />
    </SettingsShell>
  );
}
