export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blue orb - top right */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-30 animate-float blur-[100px]"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
      />
      {/* Purple orb - bottom left */}
      <div
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 animate-float blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #8b5cf6, transparent 70%)',
          animationDelay: '-7s',
        }}
      />
      {/* Cyan orb - center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20 animate-float blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
          animationDelay: '-14s',
        }}
      />
    </div>
  );
}
