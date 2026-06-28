import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'light',
  notifications: [],
  resume: null,
  adminUsers: [],
  adminResumes: [],
  contactMessages: [],
  isNavigating: false,
  setIsNavigating: (isNavigating) => set({ isNavigating }),
  showGift: false,
  giftTarget: null,
  triggerGift: (target) => set({ showGift: true, giftTarget: target }),
  closeGift: () => set({ showGift: false, giftTarget: null }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  setResume: (resume) => {
    set({ resume });
  },
  setAdminUsers: (adminUsers) => {
    set({ adminUsers });
  },
  setAdminResumes: (adminResumes) => {
    set({ adminResumes });
  },
  setContactMessages: (contactMessages) => {
    set({ contactMessages });
  },
  addContactMessage: (message) => set((state) => {
    const contactMessages = [{ id: Date.now(), is_read: false, created_at: new Date().toISOString(), ...message }, ...state.contactMessages];
    return { contactMessages };
  }),
  addNotification: (notification) => set((state) => {
    const notifications = [{ id: Date.now(), is_read: false, created_at: new Date().toISOString(), ...notification }, ...state.notifications];
    return { notifications };
  }),
  markNotificationRead: (id) => set((state) => {
    const notifications = state.notifications.map((item) => item.id === id ? { ...item, is_read: true } : item);
    return { notifications };
  }),
  updateAdminResume: (id, patch) => set((state) => {
    const adminResumes = state.adminResumes.map((item) => item.id === id ? { ...item, ...patch } : item);
    return { adminResumes };
  }),
  deleteAdminResume: (id) => set((state) => {
    const adminResumes = state.adminResumes.filter((item) => item.id !== id);
    return { adminResumes };
  }),
  deleteContactMessage: (id) => set((state) => {
    const contactMessages = state.contactMessages.filter((item) => item.id !== id);
    return { contactMessages };
  }),
  toggleContactMessageRead: (id) => set((state) => {
    const contactMessages = state.contactMessages.map((item) => item.id === id ? { ...item, is_read: !item.is_read } : item);
    return { contactMessages };
  })
}));
