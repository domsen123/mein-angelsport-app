import { auth } from '../../server/utils/auth'

export const createUser = async (): Promise<string> => {
  await auth.api.signUpEmail({
    body: {
      name: 'Dominic Marx (Admin)',
      email: 'hey@marx-media.net',
      password: 'passw0rd',
    },
  })

  const { user: { id: userId } } = await auth.api.signUpEmail({
    body: {
      name: 'Dominic Marx',
      email: 'dmarx@marxulm.de',
      password: 'passw0rd',
    },
  })
  return userId
}
