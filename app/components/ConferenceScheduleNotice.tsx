import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { isConferenceMoreThanOneMonthAway } from "~/lib/dateTime";
import type { ConferenceData } from "~/types/fosdem";

interface ConferenceScheduleNoticeProps {
  conference: ConferenceData;
}

export function ConferenceScheduleNotice({ conference }: ConferenceScheduleNoticeProps) {
  const showNotice = isConferenceMoreThanOneMonthAway(conference);

  if (!showNotice) {
    return null;
  }

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>FOSDEM is still being scheduled</AlertTitle>
      <AlertDescription>
        Events and tracks will be added as they become available closer to the event date.
      </AlertDescription>
    </Alert>
  );
}
