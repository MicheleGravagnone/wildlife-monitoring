import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api, ApiRequestError, type Query } from './client';
import type {
  AnyDetection,
  DailyActivity,
  DeadLetter,
  Deployment,
  DetectionQuery,
  HourlyActivity,
  ImageUrl,
  Items,
  LoginRequest,
  Page,
  ParkStats,
  PipelineStatus,
  RangeQuery,
  SensorHealth,
  SensorHealthDetail,
  SpeciesStats,
  StatsSummary,
  User,
} from './types';

export const meKey = ['auth', 'me'] as const;

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async ({ signal }) => {
      try {
        return await api<User>('/auth/me', { signal });
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) =>
      api<User>('/auth/login', { method: 'POST', body }),
    onSuccess: (user) => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      qc.setQueryData(meKey, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      qc.setQueryData(meKey, null);
    },
  });
}

export function useDetections(
  query: DetectionQuery,
  userId: string | null,
  enabled = true,
) {
  return useQuery<Page<AnyDetection>>({
    queryKey: ['detections', userId, query],
    queryFn: ({ signal }) =>
      api<Page<AnyDetection>>('/detections', { query: query as Query, signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDetection(id: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['detection', userId, id],
    queryFn: ({ signal }) => api<AnyDetection>(`/detections/${id}`, { signal }),
    enabled: !!id,
    retry: false,
  });
}

export function useImageUrl(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['detection-image', id],
    queryFn: ({ signal }) =>
      api<ImageUrl>(`/detections/${id}/image`, { signal }),
    enabled: !!id && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSummary(range: RangeQuery) {
  return useQuery<StatsSummary>({
    queryKey: ['stats', 'summary', range],
    queryFn: ({ signal }) =>
      api<StatsSummary>('/stats/summary', { query: { ...range }, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useSpeciesStats(range: RangeQuery & { parkName?: string }) {
  return useQuery<SpeciesStats[]>({
    queryKey: ['stats', 'species', range],
    queryFn: ({ signal }) =>
      api<Items<SpeciesStats>>('/stats/species', {
        query: { ...range },
        signal,
      }).then((r) => r.items),
    placeholderData: keepPreviousData,
  });
}

export function useParkStats(range: RangeQuery & { species?: string[] }) {
  return useQuery<ParkStats[]>({
    queryKey: ['stats', 'parks', range],
    queryFn: ({ signal }) =>
      api<Items<ParkStats>>('/stats/parks', {
        query: { ...range },
        signal,
      }).then((r) => r.items),
    placeholderData: keepPreviousData,
  });
}

export function useHourly(
  range: RangeQuery & { species?: string[]; parkName?: string },
) {
  return useQuery<HourlyActivity>({
    queryKey: ['stats', 'hourly', range],
    queryFn: ({ signal }) =>
      api<HourlyActivity>('/stats/hourly-activity', {
        query: { ...range },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useDaily(params: {
  days?: number;
  species?: string[];
  parkName?: string;
}) {
  return useQuery<DailyActivity>({
    queryKey: ['stats', 'daily', params],
    queryFn: ({ signal }) =>
      api<DailyActivity>('/stats/daily', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useSensorHealth(enabled: boolean) {
  return useQuery({
    queryKey: ['sensors', 'health'],
    queryFn: ({ signal }) =>
      api<Items<SensorHealth>>('/sensors/health', { signal }).then(
        (r) => r.items,
      ),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useSensorHealthDetail(id: string | null) {
  return useQuery({
    queryKey: ['sensors', 'health', id],
    queryFn: ({ signal }) =>
      api<SensorHealthDetail>(`/sensors/${id}/health`, { signal }),
    enabled: !!id,
  });
}

export function useDeployments(sensorId: string | null) {
  return useQuery({
    queryKey: ['deployments', sensorId],
    queryFn: ({ signal }) =>
      api<Page<Deployment>>('/deployments', {
        query: { sensorId },
        signal,
      }).then((r) => r.items),
    enabled: !!sensorId,
  });
}

export function usePipeline(enabled: boolean) {
  return useQuery({
    queryKey: ['system', 'pipeline'],
    queryFn: ({ signal }) =>
      api<PipelineStatus>('/system/pipeline', { signal }),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useDeadLetters(enabled: boolean) {
  return useQuery({
    queryKey: ['system', 'dead-letters'],
    queryFn: ({ signal }) =>
      api<Page<DeadLetter>>('/system/dead-letters', { signal }).then(
        (r) => r.items,
      ),
    enabled,
    refetchInterval: 30_000,
  });
}
