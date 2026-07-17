import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const CLOUDINARY_FALLBACK =
  'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_800,h_800,c_fill/v1780553055/IMG-20230905-WA0018_khsrzn.jpg';

const normalizeValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const formatLabel = (value = '') =>
  String(value)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter =
    searchParams.get('category') || '';

  const materialFilter =
    searchParams.get('material') || '';

  const styleFilter =
    searchParams.get('style') || '';

  const genderFilter =
    searchParams.get('gender') || '';

  const occasionFilter =
    searchParams.get('occasion') || '';

  const collectionFilter =
    searchParams.get('collection') || '';

  const metalColorFilter =
    searchParams.get('metalColor') || '';

  const minPrice = Number(
    searchParams.get('minPrice') || 0
);

const maxPrice = Number(
  searchParams.get('maxPrice') || 0
);
  const categoryParam = searchParams.get('category') || '';
  const menuParam = searchParams.get('menu') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState(categoryParam);
  const [search, setSearch] = useState('');

  const { addToCart, addToWishlist } = useCart();
  const { calculateProductEstimate } = useGoldRate();

  const getImageUrl = (value) => {
    if (!value) return CLOUDINARY_FALLBACK;

    if (Array.isArray(value)) {
      const firstImage = value.find(
        (item) => typeof item === 'string' && item.trim()
      );

      return getImageUrl(firstImage);
    }

    if (typeof value !== 'string') {
      return CLOUDINARY_FALLBACK;
    }

    const url = value.trim();

    if (!url) return CLOUDINARY_FALLBACK;

    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:image')
    ) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${API_BASE.replace('/api', '')}${url}`;
    }

    return url;
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const url = new URL(
        `${API_BASE}/products`,
        window.location.origin
      );

      // Numeric category IDs are sent to the backend.
      // Names such as "jhumka" are filtered in the frontend.
      if (
        selectedCategory &&
        /^\d+$/.test(selectedCategory)
      ) {
        url.searchParams.set(
          'category',
          selectedCategory
        );
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Products request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts(
          Array.isArray(data.products)
            ? data.products
            : []
        );
      }
    } catch (error) {
      console.error(
        'Failed to fetch products:',
        error
      );

      setProducts([]);
      toast.error('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/categories`
      );

      if (!response.ok) {
        throw new Error(
          `Categories request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );
      }
    } catch (error) {
      console.error(
        'Failed to fetch categories:',
        error
      );

      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handleCategoryChange = (event) => {
    const value = event.target.value;

    setSelectedCategory(value);

    const newParams = new URLSearchParams(
      searchParams
    );

    if (value) {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
      newParams.delete('menu');
    }

    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearch('');
    setSearchParams({});
  };

  const filteredProducts = products.filter(
  (product) => {
    const estimate =
      calculateProductEstimate(product);

    const calculatedPrice = Number(
      estimate.estimatedTotal || 0
    );

    const searchValue =
      normalizeFilter(search);

    const searchableText = normalizeFilter(
      [
        product.name,
        product.description,
        product.item_code
      ]
        .filter(Boolean)
        .join(' ')
    );

    const productCategory = normalizeFilter(
      product.category_name ||
      product.category ||
      ''
    );

    const productMaterial = normalizeFilter(
      product.material ||
      product.effective_material ||
      ''
    );

    const productStyle = normalizeFilter(
      product.style || ''
    );

    const productGender = normalizeFilter(
      product.gender || ''
    );

    const productOccasion = normalizeFilter(
      product.occasion || ''
    );

    const productCollection = normalizeFilter(
      product.collection || ''
    );

    const productMetalColor = normalizeFilter(
      product.metal_color ||
      product.metalColor ||
      ''
    );

    const matchesSearch =
      !searchValue ||
      searchableText.includes(searchValue);

    const matchesCategory =
      !categoryFilter ||
      productCategory ===
        normalizeFilter(categoryFilter);

    const matchesMaterial =
      !materialFilter ||
      productMaterial ===
        normalizeFilter(materialFilter);

    const matchesStyle =
      !styleFilter ||
      productStyle ===
        normalizeFilter(styleFilter);

    const matchesGender =
      !genderFilter ||
      productGender ===
        normalizeFilter(genderFilter);

    const matchesOccasion =
      !occasionFilter ||
      productOccasion ===
        normalizeFilter(occasionFilter);

    const matchesCollection =
      !collectionFilter ||
      productCollection ===
        normalizeFilter(collectionFilter);

    const matchesMetalColor =
      !metalColorFilter ||
      productMetalColor ===
        normalizeFilter(metalColorFilter);

    const matchesMinimumPrice =
      !minPrice ||
      calculatedPrice >= minPrice;

    const matchesMaximumPrice =
      !maxPrice ||
      calculatedPrice <= maxPrice;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesMaterial &&
      matchesStyle &&
      matchesGender &&
      matchesOccasion &&
      matchesCollection &&
      matchesMetalColor &&
      matchesMinimumPrice &&
      matchesMaximumPrice
    );
  }
);

  if (loading) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto" />

          <p className="mt-4 text-gray-600">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Our Products
          </h1>

          {(selectedCategory || menuParam) && (
            <p className="mt-2 text-gray-600">
              Showing{' '}
              {selectedCategory
                ? formatLabel(selectedCategory)
                : 'All Jewellery'}

              {menuParam &&
                normalizeValue(menuParam) !==
                  'all-jewellery' && (
                  <span>
                    {' '}
                    in {formatLabel(menuParam)}
                  </span>
                )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg flex-1 max-w-md"
          />

          <select
            value={
              /^\d+$/.test(selectedCategory)
                ? selectedCategory
                : ''
            }
            onChange={handleCategoryChange}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">
              All Categories
            </option>

            {categories.map((category) => {
              const categoryId =
                category.id ??
                category.category_id ??
                category.CategoryID;

              const categoryName =
                category.name ??
                category.category_name ??
                category.CategoryName;

              return (
                <option
                  key={categoryId}
                  value={categoryId}
                >
                  {categoryName}
                </option>
              );
            })}
          </select>

          {(selectedCategory ||
            menuParam ||
            search) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2 rounded-lg bg-black text-white hover:bg-yellow-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center bg-white rounded-xl py-16 shadow-sm">
            <p className="text-gray-500 text-lg">
              No products found
              {selectedCategory
                ? ` for "${formatLabel(
                    selectedCategory
                  )}"`
                : ''}
            </p>

            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-5 rounded-lg bg-black px-6 py-2 text-white hover:bg-yellow-700 transition"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => {
              const estimate =
                calculateProductEstimate(product);

              const productId =
                product.id || product.ProductID;

              const productName =
                product.name ||
                product.Name ||
                'Jewellery Product';

              const imageUrl = getImageUrl(
                product.images ||
                  product.image ||
                  product.ImageURL
              );

              return (
                <div
                  key={productId}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={productName}
                      className="w-full h-64 object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror =
                          null;

                        event.currentTarget.src =
                          CLOUDINARY_FALLBACK;
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        addToWishlist({
                          ...product,
                          image: imageUrl,
                          estimated_price: Math.round(
                            estimate.estimatedTotal
                          ),
                          rate_per_gram: Math.round(
                            estimate.rate
                          ),
                          purity_label:
                            estimate.purityLabel,
                        });

                        toast.success(
                          'Added to wishlist!'
                        );
                      }}
                      aria-label={`Add ${productName} to wishlist`}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow hover:text-yellow-700 transition"
                    >
                      <Heart size={20} />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {productName}
                    </h3>

                    <div className="mb-2 flex flex-wrap gap-2 text-xs">
                      {product.item_code && (
                        <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">
                          Code: {product.item_code}
                        </span>
                      )}

                      {product.huid_hallmark && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                          HUID:{' '}
                          {product.huid_hallmark}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {product.description ||
                        'Beautiful jewellery from Sai Swarn Palace.'}
                    </p>

                    <div className="mb-4 rounded-lg bg-stone-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Estimated Bill
                      </p>

                      <p className="text-yellow-700 text-xl font-bold">
                        ₹
                        {Math.round(
                          estimate.estimatedTotal || 0
                        ).toLocaleString()}
                      </p>

                      <div className="mt-2 flex flex-col gap-1 text-xs text-stone-600">
                        <span>
                          {estimate.purityLabel} Rate:
                          ₹
                          {Math.round(
                            estimate.rate || 0
                          ).toLocaleString()}
                          /g
                        </span>

                        <span>
                          Metal Value: ₹
                          {Math.round(
                            estimate.metalValue || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/products/${productId}`}
                        className="flex-1 border border-black text-black py-2 rounded text-center hover:bg-black hover:text-white transition"
                      >
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
                            ...product,
                            image: imageUrl,
                            estimated_price: Math.round(
                              estimate.estimatedTotal
                            ),
                            rate_per_gram: Math.round(
                              estimate.rate
                            ),
                            purity_label:
                              estimate.purityLabel,
                          });

                          toast.success(
                            'Added to cart!'
                          );
                        }}
                        className="flex-1 bg-black text-white py-2 rounded hover:bg-yellow-700 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;