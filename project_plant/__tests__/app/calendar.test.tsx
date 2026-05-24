import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('../../lib/notifications', () => ({
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
}));

const mockCalUser = { uid: 'test-uid', email: 'test@test.com', name: 'Test User' };
const mockCalToken = 'mock-token-123';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCalUser,
    token: mockCalToken,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

const mockLoadMonth = jest.fn();
const mockGoToPrevMonth = jest.fn();
const mockGoToNextMonth = jest.fn();
const mockMarkAsWatered = jest.fn().mockResolvedValue({ nextWateringDate: '2026-06-01' });
const mockEditSchedule = jest.fn();
const mockGetWateringsForDay = jest.fn(() => []);

jest.mock('../../hooks/useCalendar', () => ({
  useCalendar: jest.fn(() => ({
    waterings: [],
    plants: [],
    month: 4,
    year: 2026,
    loadMonth: mockLoadMonth,
    goToPrevMonth: mockGoToPrevMonth,
    goToNextMonth: mockGoToNextMonth,
    markAsWatered: mockMarkAsWatered,
    editSchedule: mockEditSchedule,
    getWateringsForDay: mockGetWateringsForDay,
  })),
}));

import CalendarScreen from '../../app/calendar';

describe('Calendar Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWateringsForDay.mockReturnValue([]);
    const hooks = require('../../hooks/useCalendar');
    hooks.useCalendar.mockReturnValue({
      waterings: [],
      plants: [],
      month: 4, year: 2026,
      loadMonth: mockLoadMonth, goToPrevMonth: mockGoToPrevMonth, goToNextMonth: mockGoToNextMonth,
      markAsWatered: mockMarkAsWatered, editSchedule: mockEditSchedule,
      getWateringsForDay: mockGetWateringsForDay,
    });
  });

  it('renders calendar header', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('Calendario de riego')).toBeTruthy();
    expect(getByText('Al día')).toBeTruthy();
  });

  it('renders back button', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('← Volver')).toBeTruthy();
  });

  it('renders current month and year', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('Mayo 2026')).toBeTruthy();
  });

  it('renders navigation buttons', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('‹')).toBeTruthy();
    expect(getByText('›')).toBeTruthy();
  });

  it('calls goToPrevMonth on prev press', () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText('‹'));
    expect(mockGoToPrevMonth).toHaveBeenCalled();
  });

  it('calls goToNextMonth on next press', () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText('›'));
    expect(mockGoToNextMonth).toHaveBeenCalled();
  });

  it('shows pending count when waterings exist', () => {
    const hooks = require('../../hooks/useCalendar');
    hooks.useCalendar.mockReturnValue({
      waterings: [{ id: 'w1', plantId: 'p1', date: '2026-05-15', completed: false, nombreComun: 'Rosa', wateringTime: '' }],
      plants: [{ id: 'p1', nombreComun: 'Rosa' }],
      month: 4, year: 2026,
      loadMonth: mockLoadMonth, goToPrevMonth: mockGoToPrevMonth, goToNextMonth: mockGoToNextMonth,
      markAsWatered: mockMarkAsWatered, editSchedule: mockEditSchedule,
      getWateringsForDay: mockGetWateringsForDay,
    });
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('1 riego pendiente')).toBeTruthy();
  });

  it('shows day detail when a day is pressed', () => {
    mockGetWateringsForDay.mockReturnValue([
      { plantId: 'p1', nombreComun: 'Rosa', completed: false, date: '2026-05-15', id: 'w1', wateringTime: '' },
    ]);
    const { getByText, getAllByText } = render(<CalendarScreen />);
    fireEvent.press(getByText('15'));
    expect(getByText('15 de Mayo')).toBeTruthy();
    expect(getAllByText('Rosa').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty day message when no waterings for selected day', () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText('15'));
    expect(getByText('No hay riegos este día')).toBeTruthy();
  });

  it('shows legend when plants exist', () => {
    const hooks = require('../../hooks/useCalendar');
    hooks.useCalendar.mockReturnValue({
      waterings: [],
      plants: [{ id: 'p1', nombreComun: 'Rosa' }],
      month: 4, year: 2026,
      loadMonth: mockLoadMonth, goToPrevMonth: mockGoToPrevMonth, goToNextMonth: mockGoToNextMonth,
      markAsWatered: mockMarkAsWatered, editSchedule: mockEditSchedule,
      getWateringsForDay: mockGetWateringsForDay,
    });
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('Tus plantas')).toBeTruthy();
    expect(getByText('Rosa')).toBeTruthy();
  });

  it('marks plant as watered from day detail', async () => {
    mockGetWateringsForDay.mockReturnValue([
      { plantId: 'p1', nombreComun: 'Rosa', completed: false, date: '2026-05-15', id: 'w1', wateringTime: '' },
    ]);
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText('15'));
    fireEvent.press(getByText('💧'));
    await act(async () => {});
    expect(mockMarkAsWatered).toHaveBeenCalledWith('p1');
  });
});
