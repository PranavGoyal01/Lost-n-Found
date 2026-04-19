interface AvatarProps {
  src: string | null | undefined;
  name?: string | null;
  size?: number;
}

export default function Avatar({ src, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      style={{ width: size, height: size, minWidth: size }}
      className="rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center"
    >
      {src ? (
        <img src={src} alt={name ?? 'User'} className="w-full h-full object-cover" />
      ) : (
        <span
          style={{ fontSize: size * 0.36 }}
          className="font-medium text-gray-400 select-none"
        >
          {initials}
        </span>
      )}
    </div>
  );
}