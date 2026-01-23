import { useState } from 'react';

interface LogoWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}

export default function LogoWithFallback({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  fallbackSrc = '/placeholder-logo.png'
}: LogoWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    // Optional: You can add loading state management here
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
      decoding="async"
    />
  );
}