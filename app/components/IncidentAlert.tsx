"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Icons } from "~/components/Icons";
import { getIncidents } from "~/server/functions/incidents";

type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  description: string;
};

export function IncidentAlert() {
  const fetchIncidents = useServerFn(getIncidents);

  const { data } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const data = await fetchIncidents();
      const incidents = data.incidents;

      const latestActiveIncident = incidents
        .filter((incident: Incident) => incident.status !== 'resolved')
        .sort((a: Incident, b: Incident) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      return latestActiveIncident || null;
    },
    staleTime: Infinity
  });

  if (!data) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'major':
        return 'destructive';
      case 'minor':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getSeverityColor(data.severity)} className="mb-4">
      <Icons.alertTriangle className="h-4 w-4" />
      <AlertTitle>Active Incident: {data.title}</AlertTitle>
      <AlertDescription>{data.description}</AlertDescription>
    </Alert>
  );
} 