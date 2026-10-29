import localFont from "next/font/local";

export const canela = localFont({
  src: [
    {
      path: "../../public/fonts/CanelaDeck-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/CanelaDeck-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-canela",
  display: "swap",
});

export const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
