const dayjs = useDayjs()

const defaultProfile = {
  id: null,
  provider: {
    id: null,
    userId: null,
  },
  nickname: null,
  firstName: null,
  lastName: null,
  avatar: null,
  email: null,
  roles: [],
  checkTime: null,
}

const useUserStore = () => {
  const userProfile = useState('userProfile', () => defaultProfile)
  const updateUserProfile = (profile) => {
    userProfile.value = {
      id: profile.id,
      provider: {
        id: profile.providerId,
        userId: profile.providerUserId,
      },
      business: {
        id: profile.businessId,
        name: null,
      },
      nickname: profile.nickname,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      email: profile.email,
      phone: profile.phone,
      birthday: dayjs(profile.birthday).format('YYYY-MM-DD'),
      gender: profile.gender,
      nation: profile.nation,
      roles: profile.roles,
      checkTime: new Date().getTime(),
      metadata: {
        needChangePassword: profile?.metadata?.needChangePassword === true,
        needSignDocument: profile?.metadata?.needSignDocument === true,
      },
    }
  }
  const refreshUserStatus = async () => {
    const response = await useTaiwinApi('/api/v1/user/profile').catch(() => null)
    if (response?.ok === true && response?.data?.id) {
      updateUserProfile(response.data)
    }

    return response
  }
  const logout = async () => {
    const response = await useTaiwinApi('/api/v1/user/auth', {
      method: 'DELETE',
    }).catch(() => null)

    if (response?.ok) {
      userProfile.value = JSON.parse(JSON.stringify(defaultProfile))
    }

    return response
  }

  const emailRegister = async (registerData) => {
    const response = await useTaiwinApi('/api/v1/user/auth/register', {
      method: 'POST',
      body: registerData,
    }).catch(error => error.data)

    if (response?.data?.id) {
      updateUserProfile(response?.data)
    }

    return response
  }

  const accountLogin = async (loginData) => {
    return useTaiwinApi('/api/v1/user/auth/account', {
      method: 'POST',
      body: loginData,
    }).then((response) => {
      if (response?.data?.id) {
        updateUserProfile(response?.data)
      }

      return response
    })
  }

  const googleLogin = async (loginData) => {
    return useTaiwinApi('/api/v1/user/auth/google', {
      method: 'POST',
      body: loginData,
    }).then((response) => {
      if (response?.data?.id) {
        updateUserProfile(response?.data)
      }

      return response
    })
  }

  return {
    userProfile,
    updateUserProfile,
    refreshUserStatus,
    emailRegister,
    accountLogin,
    googleLogin,
    logout,
  }
}

export default useUserStore
