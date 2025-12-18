'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

export interface AccessControlConfig {
    id: string;
    tenantId: string;
    userId?: string | null;
    roleId?: string | null;
    type: 'module' | 'menu' | 'ui' | 'layout';
    config: any;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface UseAccessControlOptions {
    type?: 'module' | 'menu' | 'ui' | 'layout';
    userId?: string;
    roleId?: string;
    autoFetch?: boolean;
}

export interface UseAccessControlReturn {
    configurations: AccessControlConfig[];
    loading: boolean;
    error: string | null;
    fetchConfigurations: () => Promise<void>;
    createConfiguration: (data: {
        type: 'module' | 'menu' | 'ui' | 'layout';
        userId?: string;
        roleId?: string;
        config: any;
    }) => Promise<AccessControlConfig | null>;
    updateConfiguration: (
        id: string,
        data: Partial<AccessControlConfig>
    ) => Promise<AccessControlConfig | null>;
    deleteConfiguration: (id: string) => Promise<boolean>;
    applyConfiguration: (type: 'module' | 'menu' | 'ui' | 'layout') => Promise<any>;
}

export function useAccessControl(
    options: UseAccessControlOptions = {}
): UseAccessControlReturn {
    const { type, userId, roleId, autoFetch = true } = options;

    const [configurations, setConfigurations] = useState<AccessControlConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigurations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (userId) params.append('userId', userId);
            if (roleId) params.append('roleId', roleId);

            const response = await fetchWithAuth(`/api/access-control?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                // Safely extract error message - handle both string and object
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                if (errorData?.error) {
                    if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    } else if (typeof errorData.error === 'object') {
                        errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                    } else {
                        errorMessage = String(errorData.error);
                    }
                } else if (errorData?.message) {
                    errorMessage = typeof errorData.message === 'string' ? errorData.message : String(errorData.message);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch configurations');
            }

            setConfigurations(data.data || []);
        } catch (err: any) {
            console.error('[useAccessControl] Fetch error:', err);
            // Safely extract error message
            let errorMessage = 'Failed to fetch configurations';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = String(err.message);
            } else if (err?.error) {
                errorMessage = String(err.error);
            } else if (typeof err === 'object' && err !== null) {
                errorMessage = JSON.stringify(err);
            }
            setError(errorMessage);
            setConfigurations([]);
        } finally {
            setLoading(false);
        }
    }, [type, userId, roleId]);

    const createConfiguration = useCallback(
        async (data: {
            type: 'module' | 'menu' | 'ui' | 'layout';
            userId?: string;
            roleId?: string;
            config: any;
        }): Promise<AccessControlConfig | null> => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWithAuth('/api/access-control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                    // Safely extract error message - handle both string and object
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    if (errorData?.error) {
                        if (typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (typeof errorData.error === 'object') {
                            errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                        } else {
                            errorMessage = String(errorData.error);
                        }
                    } else if (errorData?.message) {
                        errorMessage = typeof errorData.message === 'string' ? errorData.message : String(errorData.message);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to create configuration');
                }

                // Refresh list
                await fetchConfigurations();

                return result.data;
            } catch (err: any) {
                console.error('[useAccessControl] Create error:', err);
                // Safely extract error message
                let errorMessage = 'Failed to create configuration';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                } else if (err?.message) {
                    errorMessage = String(err.message);
                } else if (err?.error) {
                    errorMessage = String(err.error);
                } else if (typeof err === 'object' && err !== null) {
                    errorMessage = JSON.stringify(err);
                }
                setError(errorMessage);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [fetchConfigurations]
    );

    const updateConfiguration = useCallback(
        async (
            id: string,
            data: Partial<AccessControlConfig>
        ): Promise<AccessControlConfig | null> => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWithAuth(`/api/access-control/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                    // Safely extract error message - handle both string and object
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    if (errorData?.error) {
                        if (typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (typeof errorData.error === 'object') {
                            errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                        } else {
                            errorMessage = String(errorData.error);
                        }
                    } else if (errorData?.message) {
                        errorMessage = typeof errorData.message === 'string' ? errorData.message : String(errorData.message);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to update configuration');
                }

                // Refresh list
                await fetchConfigurations();

                return result.data;
            } catch (err: any) {
                console.error('[useAccessControl] Update error:', err);
                // Safely extract error message
                let errorMessage = 'Failed to update configuration';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                } else if (err?.message) {
                    errorMessage = String(err.message);
                } else if (err?.error) {
                    errorMessage = String(err.error);
                } else if (typeof err === 'object' && err !== null) {
                    errorMessage = JSON.stringify(err);
                }
                setError(errorMessage);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [fetchConfigurations]
    );

    const deleteConfiguration = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWithAuth(`/api/access-control/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                    // Safely extract error message - handle both string and object
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    if (errorData?.error) {
                        if (typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (typeof errorData.error === 'object') {
                            errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                        } else {
                            errorMessage = String(errorData.error);
                        }
                    } else if (errorData?.message) {
                        errorMessage = typeof errorData.message === 'string' ? errorData.message : String(errorData.message);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to delete configuration');
                }

                // Refresh list
                await fetchConfigurations();

                return true;
            } catch (err: any) {
                console.error('[useAccessControl] Delete error:', err);
                // Safely extract error message
                let errorMessage = 'Failed to delete configuration';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                } else if (err?.message) {
                    errorMessage = String(err.message);
                } else if (err?.error) {
                    errorMessage = String(err.error);
                } else if (typeof err === 'object' && err !== null) {
                    errorMessage = JSON.stringify(err);
                }
                setError(errorMessage);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [fetchConfigurations]
    );

    const applyConfiguration = useCallback(
        async (configType: 'module' | 'menu' | 'ui' | 'layout'): Promise<any> => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWithAuth('/api/access-control/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: configType }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                    // Safely extract error message - handle both string and object
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    if (errorData?.error) {
                        if (typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (typeof errorData.error === 'object') {
                            errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                        } else {
                            errorMessage = String(errorData.error);
                        }
                    } else if (errorData?.message) {
                        errorMessage = typeof errorData.message === 'string' ? errorData.message : String(errorData.message);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to apply configuration');
                }

                return result.data;
            } catch (err: any) {
                console.error('[useAccessControl] Apply error:', err);
                // Safely extract error message
                let errorMessage = 'Failed to apply configuration';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                } else if (err?.message) {
                    errorMessage = String(err.message);
                } else if (err?.error) {
                    errorMessage = String(err.error);
                } else if (typeof err === 'object' && err !== null) {
                    errorMessage = JSON.stringify(err);
                }
                setError(errorMessage);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch) {
            fetchConfigurations();
        }
    }, [autoFetch, fetchConfigurations]);

    return {
        configurations,
        loading,
        error,
        fetchConfigurations,
        createConfiguration,
        updateConfiguration,
        deleteConfiguration,
        applyConfiguration,
    };
}
