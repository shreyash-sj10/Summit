import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Generic hook to subscribe to a Supabase Realtime table and keep local state in sync
export function useRealtime(table, filter, fetcher) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const filterRef = useRef(filter);
    filterRef.current = filter;

    const filterKey = useMemo(() => JSON.stringify(filter ?? null), [filter]);

    const refresh = useCallback(async () => {
        try {
            const result = await fetcherRef.current();
            setData(result);
        } catch (e) {
            console.error(`useRealtime ${table}:`, e);
        } finally {
            setLoading(false);
        }
    }, [table]);

    useEffect(() => {
        void refresh();

        const channel = supabase
            .channel(`realtime:${table}:${filterKey}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table, filter: filterRef.current },
                () => { void refresh(); },
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [table, filterKey, refresh]);

    return { data, loading, refresh };
}
