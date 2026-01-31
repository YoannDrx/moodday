export const SiteConfig = {
  title: "Moodday",
  prodUrl: "https://moodday.app",
  appId: "moodday",
  domain: "moodday.app",
  appIcon: "/icons/android-chrome-512x512.png",
  company: {
    name: "Moodday",
    address: "", // Add your company address
  },
  brand: {
    primary: "#2BA09F", // Teal - Moodday calming color
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
