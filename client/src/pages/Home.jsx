import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Gem, Sparkles } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_URL || '/api';
const HOME_AUTO_REFRESH_MS = 60_000;
const HERO_IMAGE = 'https://res.cloudinary.com/dayhebhj7/image/upload/v1784291772/ChatGPT_Image_Jun_19_2026_09_44_46_PM_8c315e31-6a78-4077-bea2-73f5eea3f101_wsvhox.png';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [featuredStart, setFeaturedStart] = useState(0);

  const getImageUrl = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const firstValid = value.find((item) => typeof item === 'string' && item.trim());
      return getImageUrl(firstValid);
    }
    if (typeof value !== 'string') return null;

    const raw = value.trim();
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image')) {
      return raw;
    }
    if (raw.startsWith('/')) {
      return `${API_BASE.replace('/api', '')}${raw}`;
    }
    return raw;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/categories`)
        ]);

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error('Failed to load home data:', error);
      }
    };

    loadData();
  }, []);

  const heroSlides = useMemo(() => {
    const fromProducts = products
      .map((product) => getImageUrl(product.images || product.image || product.ImageURL))
      .filter(Boolean)
      .slice(0, 5);

    return [HERO_IMAGE, ...fromProducts.filter((image) => image !== HERO_IMAGE)];
  }, [products]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, HOME_AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [heroSlides]);

  useEffect(() => {
    if (products.length <= 4) return undefined;
    const timer = setInterval(() => {
      setFeaturedStart((prev) => (prev + 1) % products.length);
    }, HOME_AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [products]);

  const featuredProducts = useMemo(() => {
    if (!products.length) return [];
    const total = Math.min(4, products.length);
    return Array.from({ length: total }, (_, index) => products[(featuredStart + index) % products.length]);
  }, [products, featuredStart]);

  return (
    <div className="bg-stone-50">
      <section className="relative h-[72vh] min-h-[460px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          slide && (
            <img
              key={`${slide}-${index}`}
              src={slide}
              alt="Jewellery collection"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                heroIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        <div className="relative z-10 flex h-full w-full items-center px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-2xl text-white">
            <p className="mb-3 inline-block rounded-full border border-white/40 px-4 py-1 text-sm tracking-[0.2em]">
              SAI SWARN PALACE
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Jewellery That Changes
              <span className="block text-[#d8bb73]">With Your Every Moment</span>
            </h1>
            <p className="mb-8 text-base text-stone-200 sm:text-lg">
              Fresh collections, new images, and latest pieces directly from our live catalog.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="rounded-full bg-[#9D7E2A] px-7 py-3 font-semibold text-white transition hover:bg-[#7f6523]">
                Shop Products
              </Link>
              <Link to="/categories" className="rounded-full border border-white/50 px-7 py-3 font-semibold text-white transition hover:bg-white/10">
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-5 py-12 sm:px-8 sm:py-14 lg:px-12 xl:px-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-[#9D7E2A]">LIVE CATEGORIES</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">Shop By Collection</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              to="/products"
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                {getImageUrl(category.image || category.ImageURL || category.images) && (
                  <img
                    src={getImageUrl(category.image || category.ImageURL || category.images)}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <p className="absolute bottom-4 left-4 text-xl font-bold text-white">{category.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="w-full px-5 pb-12 sm:px-8 sm:pb-14 lg:px-12 xl:px-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-[#9D7E2A]">AUTO CHANGING</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">Featured Products</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-[#9D7E2A] hover:underline">
            View all products
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="overflow-hidden rounded-xl">
                {getImageUrl(product.images || product.image || product.ImageURL) ? (
                  <img
                    src={getImageUrl(product.images || product.image || product.ImageURL)}
                    alt={product.name}
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-64 bg-stone-100" aria-label="No product image uploaded" />
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-base font-semibold text-stone-900">{product.name}</p>
                <p className="mt-2 text-sm text-stone-600">{product.purity || '22K'} • {product.weight || 0}g</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="grid w-full grid-cols-1 gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 sm:py-12 lg:grid-cols-4 lg:px-12 xl:px-16">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-[#9D7E2A]" />
            <div>
              <p className="font-semibold text-stone-900">Certified Jewellery</p>
              <p className="text-sm text-stone-600">Trusted quality in every piece</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-1 text-[#9D7E2A]" />
            <div>
              <p className="font-semibold text-stone-900">Fast Delivery</p>
              <p className="text-sm text-stone-600">Safe shipping across India</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gem className="mt-1 text-[#9D7E2A]" />
            <div>
              <p className="font-semibold text-stone-900">Exclusive Designs</p>
              <p className="text-sm text-stone-600">Fresh collections added regularly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 text-[#9D7E2A]" />
            <div>
              <p className="font-semibold text-stone-900">Live Catalog</p>
              <p className="text-sm text-stone-600">Updated directly from admin dashboard</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
