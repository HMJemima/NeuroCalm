export default function Avatar({ name = '', size = 38, className = '' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        flex items-center justify-center rounded-xl
        bg-gradient-to-br from-accent-blue to-accent-purple
        text-white font-semibold select-none
        ${className}
      `}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || '?'}
    </div>
  );
}
