import HeroSection from "@/components/shared/hero";
import ProductList from "@/components/shared/product/product-list";
export const metadata = {
  title: "Home",
};

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ProductList title={"Kitesurfing lessons"} />
    </>
  );
};

export default HomePage;
