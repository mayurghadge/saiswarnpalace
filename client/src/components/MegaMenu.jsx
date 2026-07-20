import { useState } from 'react';
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
  if (title === 'Rings') return { category: 'Rings' };
  if (title === 'Earrings') return { category: 'Earrings' };
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

  if (menuTitle === 'Gold' || menuTitle === 'Diamond') {
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

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav className="main-navigation" onMouseLeave={() => setActiveMenu(null)}>
      <div className="menu-container">
        {menuData.map((menu) => (
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