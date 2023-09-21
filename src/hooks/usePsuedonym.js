import getRandomName from 'namesgenerator'
export default function usePsuedonym(pseudonymKey = 'myPsuedonym') {
  const extantPsuedonym = localStorage.getItem(pseudonymKey)
  if(extantPsuedonym) return extantPsuedonym
  const newPsuedonym = [ getRandomName(), new Date().getTime() ].join('.')
  localStorage.setItem(pseudonymKey, newPsuedonym)
  return newPsuedonym
}