import React from "react";
import { AppShell } from "../components/AppShell.js";
import { MetricsDashboard } from "../components/MetricsDashboard.js";

export function MetricsPage(): React.ReactElement {
  return (
    <AppShell>
      <MetricsDashboard />
    </AppShell>
  );
}
