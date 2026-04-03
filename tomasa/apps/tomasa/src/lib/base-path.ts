const basePath = process.env.NEXT_PUBLIC_REPO_NAME
  ? `/${process.env.NEXT_PUBLIC_REPO_NAME}`
  : ""

export { basePath }

export function mediaPath(path: string): string {
  return `${basePath}/media/${path}`
}
