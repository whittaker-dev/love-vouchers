import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActiveOccasionDto,
  AdminDto,
  ChangePasswordInput,
  GreetingDto,
  LoginInput,
  OccasionDto,
  OccasionInput,
  ProfileDto,
  ProfileInput,
  SettingsDto,
  SettingsInput,
  UserAccountDto,
  UserCreateInput,
  ViewerDto,
  VoucherDto,
  VoucherInput,
  WishDto,
  WishInput,
  WishQuotaDto,
} from "@love/shared";
import { ApiError, json, request } from "./client";

// All server state goes through these hooks. Query keys are defined once here so that
// invalidation after a mutation always hits every screen showing the same data.
export const queryKeys = {
  me: ["me"] as const,
  viewer: ["viewer"] as const,
  profile: ["profile"] as const,
  quota: ["quota"] as const,
  greeting: ["greeting"] as const,
  activeOccasion: (previewId: string | null) => ["occasion", "active", previewId] as const,
  vouchers: ["vouchers"] as const,
  wishes: ["wishes"] as const,
  adminVouchers: ["admin", "vouchers"] as const,
  adminVoucher: (id: string) => ["admin", "vouchers", id] as const,
  adminWishes: ["admin", "wishes"] as const,
  adminOccasions: ["admin", "occasions"] as const,
  settings: ["admin", "settings"] as const,
  adminUser: ["admin", "user"] as const,
};

/** Runs a request, mapping 401 to null so "logged out" is a value rather than an error. */
async function orNullWhenLoggedOut<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// ── Her pages ──────────────────────────────────────────────────────────

/** Who is viewing her pages (she, or the admin previewing), or null when nobody is logged in. */
export function useViewer() {
  return useQuery({
    queryKey: queryKeys.viewer,
    queryFn: () => orNullWhenLoggedOut(() => request<ViewerDto>("/auth/viewer")),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => request<ViewerDto>("/auth/user/login", { method: "POST", body: json(input) }),
    onSuccess: (viewer) => queryClient.setQueryData(queryKeys.viewer, viewer),
  });
}

export function useUserLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<void>("/auth/user/logout", { method: "POST" }),
    // Her data must not linger for whoever uses the browser next.
    onSuccess: () => queryClient.resetQueries(),
  });
}

export function useQuota() {
  return useQuery({ queryKey: queryKeys.quota, queryFn: () => request<WishQuotaDto>("/wishes/quota") });
}

export function useGreeting() {
  return useQuery({
    queryKey: queryKeys.greeting,
    queryFn: () => request<GreetingDto>("/greetings/today"),
    staleTime: 60 * 60 * 1000,
  });
}

/** Today's themed occasion; `previewId` (admin only) shows a chosen occasion instead. */
export function useActiveOccasion(previewId: string | null) {
  return useQuery({
    queryKey: queryKeys.activeOccasion(previewId),
    queryFn: () =>
      request<ActiveOccasionDto | null>(
        previewId ? `/occasions/active?preview=${encodeURIComponent(previewId)}` : "/occasions/active",
      ),
    staleTime: 60 * 60 * 1000,
  });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => request<ProfileDto>("/profile") });
}

export function useVouchers() {
  return useQuery({ queryKey: queryKeys.vouchers, queryFn: () => request<VoucherDto[]>("/vouchers") });
}

export function useWishes() {
  return useQuery({ queryKey: queryKeys.wishes, queryFn: () => request<WishDto[]>("/wishes") });
}

export function useSendWish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WishInput) => request<WishDto>("/wishes", { method: "POST", body: json(input) }),
    onSuccess: () => {
      // Remaining counts and this month's allowance changed, and the history list has a new entry.
      void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishes });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

// ── Auth ───────────────────────────────────────────────────────────────

/** Current admin, or null when logged out. Never throws for 401. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => orNullWhenLoggedOut(() => request<AdminDto>("/auth/me")),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      request<AdminDto>("/auth/login", { method: "POST", body: json(input) }),
    onSuccess: (admin) => queryClient.setQueryData(queryKeys.me, admin),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.removeQueries({ queryKey: ["admin"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      request<void>("/auth/password", { method: "PUT", body: json(input) }),
  });
}

// ── Admin ──────────────────────────────────────────────────────────────

export function useAdminVouchers() {
  return useQuery({
    queryKey: queryKeys.adminVouchers,
    queryFn: () => request<VoucherDto[]>("/admin/vouchers"),
  });
}

export function useAdminVoucher(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminVoucher(id ?? ""),
    queryFn: () => request<VoucherDto>(`/admin/vouchers/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidateVouchers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminVouchers });
    void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers });
  };
}

export function useSaveVoucher() {
  const invalidate = useInvalidateVouchers();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: VoucherInput }) =>
      id
        ? request<VoucherDto>(`/admin/vouchers/${id}`, { method: "PUT", body: json(input) })
        : request<VoucherDto>("/admin/vouchers", { method: "POST", body: json(input) }),
    onSuccess: invalidate,
  });
}

export function useDeleteVoucher() {
  const invalidate = useInvalidateVouchers();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/admin/vouchers/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      request<ProfileDto>("/admin/profile", { method: "PUT", body: json(input) }),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile, profile),
  });
}

export function useAdminWishes() {
  return useQuery({
    queryKey: queryKeys.adminWishes,
    queryFn: () => request<WishDto[]>("/admin/wishes"),
    // New wishes arrive from her phone; keep the notification list fresh without a manual reload.
    refetchInterval: 30_000,
  });
}

/**
 * Handling a notification deletes it on the server. All three actions invalidate the same data:
 * the notification list, her "Đã gửi" page, and voucher counts (cancelling gives a use back).
 */
function useNotificationAction<Variables>(path: (variables: Variables) => string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: Variables) => request<void>(path(variables), { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminWishes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminVouchers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vouchers });
    },
  });
}

/** "Xong ✓" on one voucher: removed, its use stays counted. */
export const useCompleteRedemption = () => useNotificationAction((id: string) => `/admin/redemptions/${id}/complete`);

/** "Huỷ" on one voucher: removed and its use is given back. */
export const useCancelRedemption = () => useNotificationAction((id: string) => `/admin/redemptions/${id}/cancel`);

/** "Xong hết" on a whole wish. */
export const useCompleteWish = () => useNotificationAction((id: string) => `/admin/wishes/${id}/complete`);

// ── Occasions ──────────────────────────────────────────────────────────

export function useAdminOccasions() {
  return useQuery({ queryKey: queryKeys.adminOccasions, queryFn: () => request<OccasionDto[]>("/admin/occasions") });
}

function useInvalidateOccasions() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOccasions });
    void queryClient.invalidateQueries({ queryKey: ["occasion"] });
  };
}

export function useSaveOccasion() {
  const invalidate = useInvalidateOccasions();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OccasionInput }) =>
      id
        ? request<OccasionDto>(`/admin/occasions/${id}`, { method: "PUT", body: json(input) })
        : request<OccasionDto>("/admin/occasions", { method: "POST", body: json(input) }),
    onSuccess: invalidate,
  });
}

export function useDeleteOccasion() {
  const invalidate = useInvalidateOccasions();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/admin/occasions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ── Settings & her login ───────────────────────────────────────────────

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => request<SettingsDto>("/admin/settings") });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => request<SettingsDto>("/admin/settings", { method: "PUT", body: json(input) }),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota });
    },
  });
}

export function useAdminUser() {
  return useQuery({ queryKey: queryKeys.adminUser, queryFn: () => request<UserAccountDto | null>("/admin/user") });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserCreateInput) => request<UserAccountDto>("/admin/user", { method: "POST", body: json(input) }),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.adminUser, user),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<void>("/admin/user", { method: "DELETE" }),
    onSuccess: () => queryClient.setQueryData(queryKeys.adminUser, null),
  });
}
