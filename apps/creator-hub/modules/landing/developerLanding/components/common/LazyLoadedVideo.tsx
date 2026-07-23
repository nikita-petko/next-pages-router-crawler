import React, { useRef, useEffect, useState } from 'react';

type TLazyLoadedVideo = {
  classes?: Partial<{ root: string }>;
  src: Array<{ url: string; type: 'video/webm' | 'video/mp4' }>;
  poster: string;
};

const LazyLoadedVideo = ({ classes, src, poster }: TLazyLoadedVideo) => {
  const [hasIntersected, setHasIntersected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && hasIntersected === false) {
      const observer = new IntersectionObserver(([entry]) => {
        setHasIntersected(entry.isIntersecting);
      });
      observer.observe(videoRef.current);
      return () => {
        observer.disconnect();
      };
    }
    return () => {};
    // NOTE(@rvaughan, 2024-3-13): If the rendered src or poster changes, we should also re-observe the video element.
  }, [videoRef, src, poster, hasIntersected]);

  // videos don't reload when src changes due to javascript. force a reload when src changes
  useEffect(() => {
    videoRef.current?.load();
  }, [src, poster]);

  return (
    <video ref={videoRef} className={classes?.root} autoPlay loop muted playsInline poster={poster}>
      {hasIntersected && src.map(({ url, type }) => <source src={url} type={type} key={url} />)}
    </video>
  );
};

export default LazyLoadedVideo;
