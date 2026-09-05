type LoginNavigator = Readonly<{
  replace: (href: string) => void
}>

export function redirectToLogin(navigator: LoginNavigator): void {
  navigator.replace('/login')
}
