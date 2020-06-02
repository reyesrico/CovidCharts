export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

export default interface LoadingProps {
  size: LoadingSize,
  message?: string,
  showProgress?: boolean
}
