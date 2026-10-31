// Help numbers for France. Bundled with the app so the help screen works
// offline, before sign-in and without any subscription.

export type CrisisResource = {
  number: string;
  title: string;
  description: string;
  href: `tel:${string}` | `sms:${string}`;
  action: string;
};

export const crisisResources: readonly CrisisResource[] = [
  {
    number: "3114",
    title: "3114 · Prévention du suicide",
    description:
      "Si tu as des idées suicidaires ou si tu t’inquiètes pour quelqu’un. Gratuit, 24 h/24, 7 j/7.",
    href: "tel:3114",
    action: "Appeler le 3114",
  },
  {
    number: "15",
    title: "15 · SAMU",
    description: "Urgence médicale ou danger immédiat pour ta santé.",
    href: "tel:15",
    action: "Appeler le 15",
  },
  {
    number: "112",
    title: "112 · Numéro d’urgence européen",
    description: "Depuis n’importe quel téléphone, partout en Europe.",
    href: "tel:112",
    action: "Appeler le 112",
  },
  {
    number: "114",
    title: "114 · Urgence par SMS",
    description:
      "Si tu ne peux pas parler, ou pour les personnes sourdes et malentendantes.",
    href: "sms:114",
    action: "Écrire au 114",
  },
];
