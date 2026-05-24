export const MediaTypeOptions = { All: 'All', Images: 'Images' };
export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file://mock/image.jpg' }],
});
export const getMediaLibraryPermissionsAsync = jest.fn();
export const PermissionStatus = { GRANTED: 'granted', UNDETERMINED: 'undetermined', DENIED: 'denied' };
