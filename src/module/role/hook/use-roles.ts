"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/role.api";
import type { RoleMasterInput, RoleTran } from "../type/role.types";

export const roleKeys = {
    roles: ["roles"] as const,
    roleTran: (roleId: number) => ["role-tran", roleId] as const,
    userRoles: ["user-roles"] as const,
    users: ["users"] as const,
};

export const useRoles = () => useQuery({ queryKey: roleKeys.roles, queryFn: api.fetchRoles });

export const useRoleTran = (roleId: number | null) =>
    useQuery({ queryKey: roleKeys.roleTran(roleId ?? -1), queryFn: () => api.fetchRoleTran(roleId!), enabled: roleId != null });

export const useUserRoles = () => useQuery({ queryKey: roleKeys.userRoles, queryFn: api.fetchUserRoles });

export const useUsers = () => useQuery({ queryKey: roleKeys.users, queryFn: api.fetchUsers });

export function useSaveRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ roleId, input }: { roleId?: number; input: RoleMasterInput }) =>
            roleId != null ? api.updateRole(roleId, input) : api.createRole(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: roleKeys.roles });
            qc.invalidateQueries({ queryKey: roleKeys.userRoles });
        },
    });
}

export function useDeleteRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (roleId: number) => api.deleteRole(roleId),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.roles }),
    });
}

export function useSaveRoleTran() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ roleId, rows }: { roleId: number; rows: RoleTran[] }) => api.saveRoleTran(roleId, rows),
        onSuccess: (_d, { roleId }) => qc.invalidateQueries({ queryKey: roleKeys.roleTran(roleId) }),
    });
}

/** Assign, change or remove (roleId null) a user's role. */
export function useAssignUserRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, roleId, hasRole }: { userId: number; roleId: number | null; hasRole: boolean }) => {
            if (roleId == null) return hasRole ? api.deleteUserRole(userId) : undefined;
            return hasRole ? api.updateUserRole(userId, roleId) : api.createUserRole(userId, roleId);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.userRoles }),
    });
}
