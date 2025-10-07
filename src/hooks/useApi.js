import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 useApi: Fetching data...');
        const result = await apiFunction();
        setData(result);
        console.log('✅ useApi: Data fetched successfully');
      } catch (err) {
        console.error('❌ useApi: Error fetching data', err);
        setError(err.response?.data?.message || err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

     fetchData();
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};
