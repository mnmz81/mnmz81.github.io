import { SITE } from '../app/core/site.config';

/** Sets SITE.features.blog for a test; returns a function that restores the previous value. */
export function setBlogEnabled(enabled: boolean): () => void {
  const features = SITE.features as { blog: boolean };
  const previous = features.blog;
  features.blog = enabled;
  return () => {
    features.blog = previous;
  };
}
