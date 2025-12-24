import { constants } from "~/constants";
import { isNumber } from "~/lib/type-guards";

export function preserveYearSearch(prev: Record<string, unknown>) {
  return {
    year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
  };
}
