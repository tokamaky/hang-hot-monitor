import { useState, useCallback } from 'react';
import { keywordAPI } from '../utils/api.js';

export function useKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await keywordAPI.getAll();
      setKeywords(res.data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching keywords:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addKeyword = useCallback(
    async (keyword) => {
      try {
        const res = await keywordAPI.add(keyword);
        setKeywords([res.data.data, ...keywords]);
        return res.data.data;
      } catch (err) {
        if (err.response?.status === 409) {
          setError('关键词已存在');
        } else {
          setError(err.message);
        }
        throw err;
      }
    },
    [keywords]
  );

  const deleteKeyword = useCallback(
    async (id) => {
      try {
        await keywordAPI.delete(id);
        setKeywords(keywords.filter((k) => k.id !== id));
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [keywords]
  );

  return {
    keywords,
    loading,
    error,
    fetchKeywords,
    addKeyword,
    deleteKeyword,
  };
}
