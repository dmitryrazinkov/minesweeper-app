export function wait(waitTime: number) {
  return new Promise((resolve => {
    setTimeout(() => {
      resolve(true);
    }, waitTime)
  }))
}
