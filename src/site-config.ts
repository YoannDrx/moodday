export const SiteConfig = {
  title: "Moodday",
  tagline: "Le SPM, ça se traverse à deux.",
  description:
    "Moodday aide les couples à traverser le SPM et le TDPM : elle fait son point en dix secondes, son ou sa partenaire répond par un geste. Journal de bien-être sans diagnostic.",
  prodUrl: "https://www.moodday.app",
  appId: "moodday",
  domain: "www.moodday.app",
  appIcon: "/icons/android-chrome-512x512.png",
  company: {
    name: "Yodev",
    legalForm: "Entrepreneur individuel",
    siren: "803 272 590",
    address: "",
    email: "hello@moodday.app",
  },
  brand: {
    /** Aubergine ink of the « Chaud devant » palette (see app/globals.css). */
    primary: "#2b1b30",
    /** Honey accent, readable on dark backgrounds (OG images). */
    accent: "#f2b84b",
  },
  team: {
    image: "https://github.com/YoannDrx.png",
    website: "https://yoann-andrieux.fr",
    twitter: "https://twitter.com/YoannDrx",
    name: "Yoann Andrieux",
  },
  features: {
    /**
     * If enable, you need to specify the logic of upload here : src/features/images/uploadImageAction.tsx
     * You can use Vercel Blob Storage : https://vercel.com/docs/storage/vercel-blob
     * Or you can use Cloudflare R2 : https://mlv.sh/cloudflare-r2-tutorial
     * Or you can use AWS S3 : https://mlv.sh/aws-s3-tutorial
     */
    enableImageUpload: false as boolean,
    /**
     * If enable, the user will be redirected to `/app` when he visits the landing page at `/`
     * The logic is located in middleware.ts
     */
    enableLandingRedirection: true as boolean,
  },
};
