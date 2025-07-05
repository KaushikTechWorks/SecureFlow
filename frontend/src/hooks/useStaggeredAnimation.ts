import { useEffect, useState, useRef, useCallback } from 'react';

interface UseStaggeredAnimationOptions {
  delay?: number;
  triggerOnScroll?: boolean;
  threshold?: number;
  rootMargin?: string;
}

interface AnimationEntry {
  id: string;
  element: HTMLElement;
  delay: number;
  callback: () => void;
}

// Singleton observer to handle all animations
class AnimationManager {
  private observer: IntersectionObserver | null = null;
  private entries: Map<string, AnimationEntry> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  private createObserver() {
    if (this.observer) return this.observer;

    this.observer = new IntersectionObserver(
      (observerEntries) => {
        observerEntries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animationEntry = this.entries.get(entry.target.id);
            if (animationEntry) {
              const timeout = setTimeout(() => {
                animationEntry.callback();
                this.observer?.unobserve(entry.target);
                this.entries.delete(entry.target.id);
                this.timeouts.delete(entry.target.id);
              }, animationEntry.delay * 1000);
              
              this.timeouts.set(entry.target.id, timeout);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    return this.observer;
  }

  observe(element: HTMLElement, id: string, delay: number, callback: () => void) {
    const observer = this.createObserver();
    element.id = id;
    
    this.entries.set(id, { id, element, delay, callback });
    observer.observe(element);
  }

  unobserve(id: string) {
    const entry = this.entries.get(id);
    if (entry) {
      this.observer?.unobserve(entry.element);
      this.entries.delete(id);
      
      const timeout = this.timeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(id);
      }
    }
  }

  cleanup() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.entries.clear();
    this.observer?.disconnect();
    this.observer = null;
  }
}

const animationManager = new AnimationManager();

let idCounter = 0;

export const useStaggeredAnimation = ({
  delay = 0,
  triggerOnScroll = true,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px'
}: UseStaggeredAnimationOptions = {}) => {
  const [isVisible, setIsVisible] = useState(!triggerOnScroll);
  const elementRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`animation-${++idCounter}`);

  useEffect(() => {
    if (!triggerOnScroll) {
      const timer = setTimeout(() => setIsVisible(true), delay * 1000);
      return () => clearTimeout(timer);
    }

    if (elementRef.current) {
      animationManager.observe(
        elementRef.current,
        idRef.current,
        delay,
        () => setIsVisible(true)
      );
    }

    return () => {
      animationManager.unobserve(idRef.current);
    };
  }, [delay, triggerOnScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationManager.unobserve(idRef.current);
    };
  }, []);

  return { ref: elementRef, isVisible };
};

// Cleanup function for when the app unmounts
export const cleanupAnimations = () => {
  animationManager.cleanup();
};
