export * from 'lucide-react/dist/esm/lucide-react.mjs';

const BrandIcon = ({ children, size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const Facebook = (props) => (
  <BrandIcon {...props}>
    <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z" />
  </BrandIcon>
);

export const Instagram = (props) => (
  <BrandIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.25" />
  </BrandIcon>
);

export const Twitter = (props) => (
  <BrandIcon {...props}>
    <path d="M18.9 2.8h3.7l-8.1 9.3L24 21.2h-7.4l-5.8-6.8-5.9 6.8H1.2l8.7-10L1 2.8h7.6l5.2 6.1 5.1-6.1Zm-1.3 16.2h2.1L7.5 4.9H5.2l12.4 14.1Z" />
  </BrandIcon>
);

export const Youtube = (props) => (
  <BrandIcon {...props}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 16.4V7.6l7.2 4.4-7.2 4.4Z" />
  </BrandIcon>
);
