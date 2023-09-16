import getRandomName from 'namesgenerator'

export default function usePersistAnon(anonNameKey = 'persitentAnonymousName') {
  const existingAnonName = localStorage.getItem(anonNameKey)
  if(existingAnonName) return existingAnonName
  const newAnonName = [ getRandomName(), new Date().getTime() ].join('.')
  localStorage.setItem(anonNameKey, newAnonName)
  return newAnonName
}