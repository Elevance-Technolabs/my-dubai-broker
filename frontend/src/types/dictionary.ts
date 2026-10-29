export type HomeDict = typeof import("../i18n/locales/en/home.json");
export type ContactDict = typeof import("../i18n/locales/en/contact.json");
export type SitemapDict = typeof import("../i18n/locales/en/sitemap.json");
export type AboutDict = typeof import("../i18n/locales/en/about.json");
export type CategoryDict = typeof import("../i18n/locales/en/category.json");
export type BlogDict = typeof import("../i18n/locales/en/blog.json");
export type CarListingDict =
  typeof import("../i18n/locales/en/carListing.json");
export type YachtListingDict =
  typeof import("../i18n/locales/en/yachtListing.json");
export type RealEstateListingDict =
  typeof import("../i18n/locales/en/realEstateListing.json");
export type JetListingDict =
  typeof import("../i18n/locales/en/jetListing.json");
export type HelicopterListingDict =
  typeof import("../i18n/locales/en/helicopterListing.json");
export type StoriesDict = typeof import("../i18n/locales/en/stories.json");
export type TermsDict = typeof import("../i18n/locales/en/terms.json");
export type FAQDict = typeof import("../i18n/locales/en/faq.json");
export type SupportDict = typeof import("../i18n/locales/en/support.json");
export type SearchDict = typeof import("../i18n/locales/en/search.json");
export type DeveloperDict = typeof import("../i18n/locales/en/developer.json");
export type BlogArticleDict =
  typeof import("../i18n/locales/en/blogArticle.json");
export type PrivacyDict = typeof import("../i18n/locales/en/privacy.json");
export type BuyingStandardsDict =
  typeof import("../i18n/locales/en/buyingStandards.json");
export type TrustedJourneysDict =
  typeof import("../i18n/locales/en/trustedJourneys.json");
export type SelectCategoryDict =
  typeof import("../i18n/locales/en/selectCategory.json");
export type BusinessTermsDict =
  typeof import("../i18n/locales/en/businessTerms.json");
export type BrandVisibilityDict =
  typeof import("../i18n/locales/en/brandVisibility.json");
export type OnboardingDict =
  typeof import("../i18n/locales/en/onboarding.json");

export type Dictionary = {
  home: HomeDict;
  contact: ContactDict;
  sitemap: SitemapDict;
  about: AboutDict;
  category: CategoryDict;
  blog: BlogDict;
  carListing: CarListingDict;
  yachtListing: YachtListingDict;
  realEstateListing: RealEstateListingDict;
  jetListing: JetListingDict;
  helicopterListing: HelicopterListingDict;
  terms: TermsDict;
  stories: StoriesDict;
  privacy: PrivacyDict;
  faq: FAQDict;
  support: SupportDict;
  search: SearchDict;
  developer: DeveloperDict;
  blogArticle: BlogArticleDict;
  buyingStandards: BuyingStandardsDict;
  trustedJourneys: TrustedJourneysDict;
  selectCategory: SelectCategoryDict;
  businessTerms: BusinessTermsDict;
  brandVisibility: BrandVisibilityDict;
  onboarding: OnboardingDict;
};
