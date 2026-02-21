import type { UserState } from '~/types'

interface UserStoreState {
  user: UserState | null
  token: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserStoreState => ({
    user: null,
    token: null,
  }),

  getters: {
    isLoggedIn: (state): boolean => Boolean(state.user && state.token),
    displayName: (state): string => state.user?.name ?? 'Guest',
  },

  actions: {
    setUser(user: UserState, token: string): void {
      this.user = user
      this.token = token
    },

    logout(): void {
      this.user = null
      this.token = null
    },

    updateProfile(partial: Partial<UserState>): void {
      if (!this.user) {
        return
      }

      this.user = {
        ...this.user,
        ...partial,
      }
    },
  },
})
