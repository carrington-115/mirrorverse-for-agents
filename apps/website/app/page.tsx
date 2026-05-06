import {
  Communication,
  Features,
  Footer,
  Hero,
  Product,
  Updates,
  FAQ,
} from "@/sections";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Hero />
      <Product />
      <Communication />
      <Features />
      <Updates />
      <FAQ />
      <Footer />
    </div>
  );
}
