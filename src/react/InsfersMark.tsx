import React from 'react';
import { INSFERS_MARK_STANDARD, INSFERS_MARK_INVERTED } from '../logo';

export { INSFERS_MARK_STANDARD, INSFERS_MARK_INVERTED };

export interface InsfersMarkProps {
  size?: number | string;
  variant?: 'standard' | 'inverted';
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Insfers official circular logo mark.
 * - 'standard': Blue circular disc with white Insfers transfer arrows (for light backgrounds).
 * - 'inverted': Crisp white circular disc with blue Insfers transfer arrows (for blue buttons/dark backgrounds).
 */
export const InsfersMark: React.FC<InsfersMarkProps> = ({
  size = 24,
  variant = 'standard',
  className = '',
  style = {},
  alt = 'Insfers',
}) => {
  const src = variant === 'inverted' ? INSFERS_MARK_INVERTED : INSFERS_MARK_STANDARD;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: '50%',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
      draggable={false}
    />
  );
};

export default InsfersMark;
