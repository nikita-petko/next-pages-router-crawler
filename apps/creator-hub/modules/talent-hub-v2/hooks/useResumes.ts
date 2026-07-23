import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { resumeClient } from '../api/resumeClient';
import { th2QueryKeys } from '../queryKeys';
import type { ApiResume, ApiResumeListResponse } from '../types';
import {
  isMocksEnabled,
  isNoResumesMockEnabled,
  isRuntimeMocksQueryEnabled,
  TH2_QUERY_OPTIONS,
} from '../utils';

const ACCEPTED_TYPES = ['application/pdf'];
export const MAX_RESUME_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_RESUME_FILE_SIZE_MB * 1024 * 1024;
const MOCK_RESUMES_STORAGE_KEY = 'th2_mock_resumes';

const MOCK_RESUMES: ApiResume[] = [
  {
    id: 'mock-resume-1',
    userId: 1,
    fileName: 'turbo-engineer-resume.pdf',
    contentType: 'application/pdf',
    sizeBytes: 245_000,
    status: 'active',
    createdAt: '2025-12-06T12:00:00Z',
    confirmedAt: '2025-12-06T12:00:05Z',
  },
];

function useClientReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => setIsReady(true), []);
  return isReady;
}

function readMockResumes(): ApiResume[] {
  if (typeof window === 'undefined') {
    return MOCK_RESUMES;
  }
  try {
    const stored = window.sessionStorage.getItem(MOCK_RESUMES_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    const persisted = Array.isArray(parsed) ? (parsed as ApiResume[]) : [];
    if (isNoResumesMockEnabled()) {
      return persisted;
    }
    return [...persisted, ...MOCK_RESUMES];
  } catch {
    return MOCK_RESUMES;
  }
}

function writeMockResume(resume: ApiResume): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const existing = readMockResumes().filter((item) => item.id !== resume.id);
    const withoutDefaults = existing.filter(
      (item) => !MOCK_RESUMES.some((defaultResume) => defaultResume.id === item.id),
    );
    window.sessionStorage.setItem(
      MOCK_RESUMES_STORAGE_KEY,
      JSON.stringify([resume, ...withoutDefaults]),
    );
  } catch {
    // Mock persistence is best-effort; the uploaded resume still lives in query cache.
  }
}

function deleteMockResume(resumeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const existing = readMockResumes().filter(
      (item) => item.id !== resumeId && !MOCK_RESUMES.some((resume) => resume.id === item.id),
    );
    window.sessionStorage.setItem(MOCK_RESUMES_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Mock persistence is best-effort.
  }
}

export function useResumes() {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  return useQuery<ApiResumeListResponse>({
    queryKey: th2QueryKeys.resumes.list(mocks),
    queryFn: async () => {
      if (mocks) {
        return { resumes: readMockResumes() };
      }
      return resumeClient.list();
    },
    enabled: isClientReady,
    ...TH2_QUERY_OPTIONS,
  });
}

export function useActiveResume(): ApiResume | null {
  const { data } = useResumes();
  const active = data?.resumes?.filter((r) => r.status === 'active') ?? [];
  return active[0] ?? null;
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);

  return useMutation<void, Error, string>({
    mutationFn: async (resumeId) => {
      if (mocks) {
        return;
      }
      await resumeClient.delete(resumeId);
    },
    onMutate: async (resumeId) => {
      if (!mocks) {
        return;
      }
      deleteMockResume(resumeId);
      await queryClient.cancelQueries({ queryKey: th2QueryKeys.resumes.all });
      queryClient.setQueriesData<ApiResumeListResponse>(
        { queryKey: th2QueryKeys.resumes.all },
        (old) => {
          if (!old) {
            return old;
          }
          return { resumes: old.resumes.filter((r) => r.id !== resumeId) };
        },
      );
    },
    onSuccess: () => {
      if (mocks) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.resumes.all });
    },
  });
}

type UploadState = {
  isUploading: boolean;
  progress: 'idle' | 'initiating' | 'uploading' | 'confirming' | 'done' | 'error';
  error: string | null;
};

export function useResumeUpload() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 'idle',
    error: null,
  });

  const upload = useCallback(
    async (file: File): Promise<ApiResume | null> => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setState({ isUploading: false, progress: 'error', error: 'Error.ResumePdfOnly' });
        return null;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setState({ isUploading: false, progress: 'error', error: 'Error.ResumeFileTooLarge' });
        return null;
      }

      setState({ isUploading: true, progress: 'initiating', error: null });

      try {
        if (mocks) {
          const mockResume: ApiResume = {
            id: `mock-resume-${Date.now()}`,
            userId: 1,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            status: 'active',
            createdAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
          };
          writeMockResume(mockResume);
          queryClient.setQueriesData<ApiResumeListResponse>(
            { queryKey: th2QueryKeys.resumes.all },
            (old) => ({
              resumes: [
                mockResume,
                ...(old?.resumes ?? readMockResumes()).filter(
                  (resume) => resume.id !== mockResume.id,
                ),
              ],
            }),
          );
          setState({ isUploading: false, progress: 'done', error: null });
          return mockResume;
        }

        const { resumeId, uploadUrl } = await resumeClient.initUpload(file.name);
        setState({ isUploading: true, progress: 'uploading', error: null });
        await resumeClient.uploadToS3(uploadUrl, file);

        setState({ isUploading: true, progress: 'confirming', error: null });
        const confirmed = await resumeClient.confirm(resumeId);
        queryClient.setQueriesData<ApiResumeListResponse>(
          { queryKey: th2QueryKeys.resumes.all },
          (old) => ({
            resumes: [confirmed, ...(old?.resumes ?? []).filter((r) => r.id !== confirmed.id)],
          }),
        );
        queryClient.invalidateQueries({ queryKey: th2QueryKeys.resumes.all });

        setState({ isUploading: false, progress: 'done', error: null });
        return confirmed;
      } catch {
        setState({
          isUploading: false,
          progress: 'error',
          error: 'Error.ResumeUploadFailed',
        });
        return null;
      }
    },
    [mocks, queryClient],
  );

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 'idle', error: null });
  }, []);

  return { ...state, upload, reset };
}
