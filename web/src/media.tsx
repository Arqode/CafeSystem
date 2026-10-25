import type { Product } from './types';

// Presentation only. No product schema, stored data, or order payload changes.
const PHOTOS: Record<string, { slug: string; alt: string; width?: number; height?: number }> = {
  cheeseburger: { slug: 'cheeseburger', alt: 'Example cheeseburger with cheese, lettuce and tomato on a white background', width: 740, height: 462 },
  'chicken burger': { slug: 'chicken-burger', alt: 'Example fried chicken burger in a bun' },
  'double burger': { slug: 'double-burger', alt: 'Example double cheeseburger with a grilled cheese bun' },
  cola: { slug: 'cola', alt: 'Example glass of cola on a table beside flowers' },
  lemonade: { slug: 'lemonade', alt: 'Example pale lemonade served in a glass jar' },
  americano: { slug: 'americano', alt: 'Example black coffee in a white cup' },
  cheesecake: { slug: 'cheesecake', alt: 'Example New York cheesecake with a red fruit topping' },
  brownie: { slug: 'brownie', alt: 'Example chocolate brownie' },
};

export function ProductPhoto({ product, priority }: { product: Product; priority: boolean }) {
  const photo = PHOTOS[product.name.trim().toLowerCase()];
  // Staff-created or renamed products retain the original text card.
  if (!photo) return null;
  const width = photo.width ?? 800;
  const height = photo.height ?? 500;
  return (
    <figure className="product-photo">
      <img
        src={`/media/${photo.slug}-${width}.webp`}
        srcSet={`/media/${photo.slug}-400.webp 400w, /media/${photo.slug}-${width}.webp ${width}w`}
        sizes="(max-width: 400px) calc(100vw - 84px), (max-width: 520px) calc(100vw - 92px), 428px"
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        alt={photo.alt}
      />
      <figcaption>Example photo · actual presentation may vary</figcaption>
    </figure>
  );
}
