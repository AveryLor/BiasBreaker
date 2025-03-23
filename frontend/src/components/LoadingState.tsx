export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-10 w-full">
      <div className="w-12 h-12 rounded-full border-4 border-cyan-900/30 border-t-fuchsia-500 border-r-cyan-500 animate-spin"></div>
      <p className="mt-4 text-cyan-400">Synthesizing perspectives...</p>
    </div>
  );
} 