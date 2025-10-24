import { useState, useEffect, useCallback } from 'react';

export const useMicPermission = () => {
    const [micPermissionStatus, setMicPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

    const checkMicPermission = useCallback(async () => {
        if (!navigator.permissions) {
            console.warn("Permissions API not supported.");
            return;
        }
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermissionStatus(permissionStatus.state);
            permissionStatus.onchange = () => {
                setMicPermissionStatus(permissionStatus.state);
            };
        } catch (error) {
            console.error("Could not query microphone permission:", error);
        }
    }, []);

    useEffect(() => {
        checkMicPermission();
    }, [checkMicPermission]);

    return micPermissionStatus;
};
