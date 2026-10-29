import { Dictionary } from "@/types/dictionary";
import { Locale } from "./config";

export type NameSpaces = keyof Dictionary;

export async function getDictionary<T extends readonly NameSpaces[]>(
  locale: string,
  namespaces: T,
): Promise<{ [K in T[number]]: Dictionary[K] }> {
  const data = await Promise.all(
    namespaces.map(async (ns) => {
      const dict = await import(`./locales/${locale as Locale}/${ns}.json`);
      return { [ns]: dict.default };
    }),
  );

  return Object.assign({}, ...data);
}
