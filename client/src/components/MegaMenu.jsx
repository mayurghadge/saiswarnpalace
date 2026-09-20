import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { menuData } from '../data/menuData';
import './MegaMenu.css';

const createProductsUrl = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value).trim());
    }
  });

  const query = params.toString();
  return query ? `/products?${query}` : '/products';
};

const mainMenuFilters = (title) => {
  if (title === 'Gold') return { material: 'Gold' };
  if (title === 'Diamond') return { material: 'Diamond' };
  if (title === 'Silver') return { material: 'Silver' };
  return {};
};

const itemFilters = (menuTitle, heading, label) => {
  const filters = { ...mainMenuFilters(menuTitle) };
  const upperHeading = heading.toUpperCase();

  if (menuTitle === 'All Jewellery') {
    if (upperHeading === 'CATEGORIES') filters.category = label;
    if (upperHeading === 'GENDER') filters.gender = label;
    if (upperHeading === 'COLLECTIONS') filters.collection = label;

    if (upperHeading === 'PRICE') {
      const priceRanges = {
        'Below 5000': { maxPrice: 5000 },
        '5000 - 10000': { minPrice: 5000, maxPrice: 10000 },
        '10000 - 20000': { minPrice: 10000, maxPrice: 20000 },
        '20000 - 30000': { minPrice: 20000, maxPrice: 30000 },
        '30000 - 50000': { minPrice: 30000, maxPrice: 50000 },
        'Above 50000': { minPrice: 50000 },
      };
      Object.assign(filters, priceRanges[label] || {});
    }

    return filters;
  }

  if (menuTitle === 'Gold' || menuTitle === 'Diamond' || menuTitle === 'Silver') {
    if (upperHeading.includes('EARRING')) {
      filters.category = 'Earrings';
      filters.style = label;
    } else if (upperHeading.includes('RING')) {
      filters.category = 'Rings';
      filters.style = label;
    } else if (upperHeading.includes('PENDANT')) {
      filters.category = 'Pendants';
      filters.style = label;
    } else if (upperHeading.includes('NECKWEAR')) {
      filters.category = label;
    } else if (upperHeading === 'COLLECTIONS') {
      filters.collection = label;
    } else {
      filters.category = label;
    }

    return filters;
  }

  if (menuTitle === 'Rings') {
    filters.category = 'Rings';
    if (upperHeading === 'GOLD' || upperHeading === 'DIAMOND') {
      filters.material = upperHeading === 'GOLD' ? 'Gold' : 'Diamond';
      filters.style = label;
    } else if (label === 'Women' || label === 'Men' || label === 'Kids') {
      filters.gender = label;
    } else {
      filters.style = label;
    }
    return filters;
  }

  if (menuTitle === 'Earrings') {
    filters.category = 'Earrings';
    if (upperHeading === 'GOLD' || upperHeading === 'DIAMOND') {
      filters.material = upperHeading === 'GOLD' ? 'Gold' : 'Diamond';
      filters.style = label;
    } else {
      filters.occasion = label;
    }
  }

  return filters;
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const normalizeMaterial = (value) => String(value || '').trim().toLowerCase();

const categoryItem = (category, material) => ({
  label: category.name,
  filters: {
    category: category.id,
    ...(material === 'All Jewellery' ? {} : { material })
  }
});

const buildMaterialGroups = (categories, material) => {
  const materialCategories = categories.filter(
    (category) => normalizeMaterial(category.material) === normalizeMaterial(material)
  );
  const categoryIds = new Set(materialCategories.map((category) => category.id));
  const roots = materialCategories.filter(
    (category) => !category.parent_category_id || !categoryIds.has(category.parent_category_id)
  );

  return roots.map((root) => {
    const children = materialCategories.filter(
      (category) => category.parent_category_id === root.id
    );

    return {
      heading: root.name.toUpperCase(),
      items: children.length
        ? [
            { label: `All ${root.name}`, filters: { category: root.id, material } },
            ...children.map((category) => categoryItem(category, material))
          ]
        : [categoryItem(root, material)]
    };
  });
};

const buildDynamicMenuData = (categories) => {
  const activeCategories = categories.filter(
    (category) => category.is_active !== false && category.is_active !== 0
  );

  return menuData.map((menu) => {
    if (menu.title === 'All Jewellery') {
      const categoryItems = activeCategories
        .filter((category) => !category.parent_category_id)
        .map((category) => categoryItem(category, menu.title));

      if (!categoryItems.length) return menu;

      return {
        ...menu,
        groups: menu.groups.map((group) =>
          group.heading === 'CATEGORIES'
            ? { ...group, items: categoryItems }
            : group
        )
      };
    }

    const groups = buildMaterialGroups(activeCategories, menu.title);
    return groups.length ? { ...menu, groups } : menu;
  });
};

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [menus, setMenus] = useState(menuData);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) return;

        const data = await response.json();
        const categories = Array.isArray(data) ? data : data.categories;

        if (isMounted && Array.isArray(categories) && categories.length) {
          setMenus(buildDynamicMenuData(categories));
        }
      } catch (error) {
        console.error('Failed to load menu categories:', error);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav className="main-navigation" onMouseLeave={() => setActiveMenu(null)}>
      <div className="menu-container">
        {menus.map((menu) => (
          <div
            className="menu-item"
            key={menu.title}
            onMouseEnter={() => setActiveMenu(menu.title)}
          >
            <Link
              className={`menu-button ${activeMenu === menu.title ? 'active' : ''}`}
              to={createProductsUrl(mainMenuFilters(menu.title))}
              onClick={() => setActiveMenu(null)}
            >
              {menu.title}
              <span className="menu-arrow">⌄</span>
            </Link>

            {activeMenu === menu.title && (
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  {menu.groups.map((group) => (
                    <div className="mega-menu-group" key={group.heading}>
                      <h3>{group.heading}</h3>

                      {group.items.map((rawItem) => {
                        const item =
                          typeof rawItem === 'string'
                            ? { label: rawItem }
                            : rawItem;
                        const destination =
                          item.to ||
                          createProductsUrl(
                            item.filters ||
                              itemFilters(menu.title, group.heading, item.label)
                          );

                        return (
                          <Link
                            key={`${group.heading}-${item.label}`}
                            to={destination}
                            onClick={() => setActiveMenu(null)}
                            className="mega-menu-link"
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mega-menu-special">
                  <span>NEW COLLECTION</span>
                  <strong>Bridal Jewellery</strong>
                  <Link
                    to={createProductsUrl({ collection: 'Bridal Collection' })}
                    onClick={() => setActiveMenu(null)}
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}