import { getSiteUrl } from "../../config/site";

const site = getSiteUrl();

export const metadata = {
  title: "Search",
  description: "Search MinKowskiM blog posts",
  alternates: { canonical: `${site}/search` },
};

export default function SearchLayout({ children }) {
  return children;
}
