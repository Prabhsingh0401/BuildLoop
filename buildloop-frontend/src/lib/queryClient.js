import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,    // 1 minute — matches spec requirement
      retry: 1,                 // one retry on failure — matches spec requirement
    },
  },
});

export default queryClient;
