/** @type {import('next').NextConfig} */
const supabaseHostname = (() => {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!rawUrl) return null;
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [
  {
    protocol: "https",
    hostname: "a0.muscache.com",
  },
  {
    protocol: "https",
    hostname: "static.vecteezy.com",
  },
  {
    protocol: "https",
    hostname: "avatar.vercel.sh",
  },
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
  },
  {
    protocol: "https",
    hostname: "gravatar.com",
  },
  {
    protocol: "https",
    hostname: "cdn.jsdelivr.net",
  },
];

if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
  });
}

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns,
  },
};

export default nextConfig;
