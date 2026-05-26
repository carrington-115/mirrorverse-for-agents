import { Communication, Features, Footer, Hero, Pricing, Product, Updates, FAQ } from "@/sections";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Hero />
      <Product />
      <Communication />
      <Features />
      <Pricing />
      <Updates />
      <FAQ />
      <Footer />
    </div>
  );
}
