interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Synthesizing perspectives..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 w-full">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
} 