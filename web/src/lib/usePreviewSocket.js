import { useState, useEffect, useCallback } from 'react';

export function usePreviewSocket(url = 'ws://localhost:8765') {
  const [previews, setPreviews] = useState([]);
  const [pipelineEvents, setPipelineEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws = null;
    try {
      ws = new WebSocket(url);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'preview') {
            // Store only the handle + small metadata — never the full coefficient block.
            // Full coefficients are fetched on explicit user action via fetchFullBlock().
            const { coeff_oid, dim, group, exec_ms, thumbnail, summary } = msg;
            setPreviews(prev =>
              [{ coeff_oid, dim, group, exec_ms, thumbnail, summary }, ...prev].slice(0, 50)
            );
          } else if (msg.type === 'pipeline') {
            setPipelineEvents(prev => [msg, ...prev].slice(0, 200));
          }
        } catch {}
      };
    } catch {}
    return () => { if (ws) ws.close(); };
  }, [url]);

  // Only called from an explicit user button click — never auto-triggered.
  const fetchFullBlock = useCallback(async (coeff_oid, page = 0) => {
    const res = await fetch(`/api/coeffs/${coeff_oid}?page=${page}`);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return res.json();
  }, []);

  return { previews, pipelineEvents, connected, fetchFullBlock };
}
