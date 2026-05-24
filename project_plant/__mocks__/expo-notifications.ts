export const requestPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
export const getPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
export const scheduleNotificationAsync = jest.fn();
export const cancelScheduledNotificationAsync = jest.fn();
export const cancelAllScheduledNotificationsAsync = jest.fn();
