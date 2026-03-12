import { useState, useCallback } from "react";
import { supabase } from "../supabase";

export function useCohort() {
  const [dbCohort, setDbCohort] = useState(null);

  const syncCohort = useCallback(async (name, startDate, endDate) => {
    const { data: ex } = await supabase
      .from('cohorts')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (ex) {
      await supabase
        .from('cohorts')
        .update({ start_date: startDate, end_date: endDate })
        .eq('id', ex.id);
      const updated = { ...ex, start_date: startDate, end_date: endDate };
      setDbCohort(updated);
      return updated;
    } else {
      const { data: n } = await supabase
        .from('cohorts')
        .insert({ name, start_date: startDate, end_date: endDate })
        .select()
        .single();
      setDbCohort(n);
      return n;
    }
  }, []);

  return { dbCohort, syncCohort };
}
