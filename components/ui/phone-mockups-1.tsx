import {
  PhoneCarousel,
  type ImageItem,
} from '@/components/ui/phone-mockups-1-utils/phone-carousel';

/**
 * ⚠️ PLACEHOLDER SCREENS.
 *
 * These four images ship with the upstream component and are screenshots of
 * Behance, Notion, One and Reddit — other companies' apps, served from a
 * third-party Cloudinary account. They render because res.cloudinary.com is
 * already allowed in next.config.mjs, but they must be replaced with real
 * Spllit screens (map, ride detail, squad) before this goes in front of
 * anyone. Swapping the four entries below is the whole change.
 */
const exampleImages: ImageItem[] = [
  {
    src: 'https://res.cloudinary.com/harshitproject/image/upload/v1746774805/Behance-screen.png',
    alt: 'Behance app on iPhone',
  },
  {
    src: 'https://res.cloudinary.com/harshitproject/image/upload/v1746774805/Notion-screen.png',
    alt: 'Notion app on iPhone',
  },
  {
    src: 'https://res.cloudinary.com/harshitproject/image/upload/v1746774806/One-screen.png',
    alt: 'One app on iPhone',
  },
  {
    src: 'https://res.cloudinary.com/harshitproject/image/upload/v1746774807/Reddit-nj7hwh.png',
    alt: 'Reddit app on iPhone',
  },
];

export default function PhoneMockupBasic() {
  return <PhoneCarousel images={exampleImages} />;
}
