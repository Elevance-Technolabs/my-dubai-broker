"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ImageWithLoaderProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

const ImageWithLoader = ({
  src,
  alt,
  className,
  wrapperClassName,
  ...props
}: ImageWithLoaderProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={cn("relative overflow-hidden bg-gray-100", wrapperClassName)}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 h-full w-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </div>
  );
};

export default ImageWithLoader;
