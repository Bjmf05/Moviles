import { CameraType, CameraView, FlashMode } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";

import CameraService, {
  CaptureOptions,
  PhotoResult,
} from "@/services/cameraService";
import PermissionService, {
  AppPermissions,
} from "@/services/permissionService";

interface UseCameraOptions {
  requestOnMount?: boolean;
}

interface UseCameraReturn {
  cameraRef: React.RefObject<CameraView | null>;
  permissions: AppPermissions | null;
  isPermissionGranted: boolean;
  isLoadingPermissions: boolean;
  facing: CameraType;
  flashMode: FlashMode;
  requestCameraPermission: () => Promise<boolean>;
  requestPermissions: () => Promise<void>;
  takePhoto: (options?: CaptureOptions) => Promise<PhotoResult | null>;
  toggleFacing: () => void;
  toggleFlash: () => void;
  saveToGallery: (uri: string) => Promise<void>;
  lastPhoto: PhotoResult | null;
  error: string | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { requestOnMount = true } = options;

  const cameraRef = useRef<CameraView>(null);

  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [lastPhoto, setLastPhoto] = useState<PhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPermissionGranted =
    !!permissions &&
    PermissionService.isGranted(permissions.camera) &&
    PermissionService.isGranted(permissions.mediaLibrary);

  const requestPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    setError(null);
    try {
      const result = await PermissionService.requestAllPermissions();
      setPermissions(result);
    } catch {
      setError("Error al solicitar permisos");
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    setIsLoadingPermissions(true);
    setError(null);
    try {
      const camera = await PermissionService.requestCameraPermission();
      setPermissions((prev) => ({
        camera,
        mediaLibrary: prev?.mediaLibrary ?? "undetermined",
      }));
      return PermissionService.isGranted(camera);
    } catch {
      setError("Error al solicitar permisos");
      return false;
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    if (requestOnMount) {
      requestPermissions();
    }
  }, [requestOnMount, requestPermissions]);

  const takePhoto = useCallback(
    async (options: CaptureOptions = {}): Promise<PhotoResult | null> => {
      setError(null);
      if (cameraRef.current === null) {
        throw new Error("No se ha detectado ninguna cámara");
      }
      try {
        const photo = await CameraService.takePhoto(
          cameraRef as React.RefObject<CameraView>,
          options,
        );
        setLastPhoto(photo);
        return photo;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al capturar foto";
        setError(message);
        return null;
      }
    },
    [],
  );

  const toggleFacing = useCallback(() => {
    setFacing((prev) => CameraService.toggleFacing(prev));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => CameraService.cycleFlashMode(prev));
  }, []);

  const saveToGallery = useCallback(async (uri: string) => {
    setError(null);
    try {
      const mediaLibrary =
        await PermissionService.requestMediaLibraryPermission();
      if (!PermissionService.isGranted(mediaLibrary)) {
        setPermissions((prev) => ({
          camera: prev?.camera ?? "undetermined",
          mediaLibrary,
        }));
        throw new Error("Permiso de galería denegado");
      }
      setPermissions((prev) => ({
        camera: prev?.camera ?? "undetermined",
        mediaLibrary,
      }));
      await CameraService.saveToGallery(uri);
    } catch {
      setError("Error al guardar en galería");
    }
  }, []);

  return {
    cameraRef,
    permissions,
    isPermissionGranted,
    isLoadingPermissions,
    facing,
    flashMode,
    requestCameraPermission,
    requestPermissions,
    takePhoto,
    toggleFacing,
    toggleFlash,
    saveToGallery,
    lastPhoto,
    error,
  };
}
