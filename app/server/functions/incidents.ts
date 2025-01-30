import { createServerFn } from "@tanstack/start";

import { getCloudflareEnv } from "../config";

export const getIncidents = createServerFn({
  method: "GET",
})
  .handler(async () => {
    try {
      const env = getCloudflareEnv();
      const { INCIDENT_IO_API_KEY } = env;

      const response = await fetch('https://api.incident.io/v2/incidents', {
        headers: {
          'Authorization': `Bearer ${INCIDENT_IO_API_KEY}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return { incidents: [] };
    }
  }); 