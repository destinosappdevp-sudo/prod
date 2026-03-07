export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Anillo giratorio */}
        <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
        {/* Logo Z */}
        <span className="text-orange-500 font-black text-5xl leading-none select-none">
          Z
        </span>
      </div>
    </div>
  );
}
