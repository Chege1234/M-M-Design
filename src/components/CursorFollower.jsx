import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const HOVER_SELECTOR = 'a, button, .project-card, nav a, nav button';

const circleStyle = {
  width: 16,
  height: 16,
  border: '1.5px solid #D4A574',
  background: 'transparent',
  borderRadius: '50%',
  position: 'fixed',
  top: 0,
  left: 0,
  pointerEvents: 'none',
  zIndex: 9999,
};

export default function CursorFollower() {
  const circleRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setEnabled(mq.matches);
    const onChange = (e) => setEnabled(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const circle = circleRef.current;
    if (!circle) return;

    gsap.set(circle, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(circle, 'x', { duration: 0.08, ease: 'power3.out' });
    const yTo = gsap.quickTo(circle, 'y', { duration: 0.08, ease: 'power3.out' });

    const onMove = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const onEnter = () => {
      gsap.to(circle, { width: 28, height: 28, duration: 0.15 });
    };

    const onLeave = () => {
      gsap.to(circle, { width: 16, height: 16, duration: 0.15 });
    };

    window.addEventListener('mousemove', onMove);

    const bindHover = () => {
      document.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    bindHover();
    const observer = new MutationObserver(bindHover);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
      document.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={circleRef} style={circleStyle} aria-hidden="true" />;
}
