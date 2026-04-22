import { useState, useCallback } from 'react';
import { hotspotsAPI } from '../utils/api.js';

export function useHotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });

  const fetchHotspots = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await hotspotsAPI.getAll(limit, offset);
      setHotspots(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching hotspots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchHotspots = useCallback(async (keyword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await hotspotsAPI.search(keyword);
      setHotspots(res.data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error searching hotspots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hotspots,
    loading,
    error,
    pagination,
    fetchHotspots,
    searchHotspots,
  };
}
