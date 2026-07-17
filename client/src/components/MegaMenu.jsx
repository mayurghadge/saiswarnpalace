import { useState } from "react";
import { Link } from "react-router-dom";
import { menuData } from "../data/menuData";
import "./MegaMenu.css";

function createSlug(value) {
  return value
    .toLowerCase()
    .replace(/₹/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav
      className="main-navigation"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="menu-container">
        {menuData.map((menu) => (
          <div
            className="menu-item"
            key={menu.title}
            onMouseEnter={() => setActiveMenu(menu.title)}
          >
            <button
              type="button"
              className={`menu-button ${
                activeMenu === menu.title ? "active" : ""
              }`}
              onClick={() =>
                setActiveMenu(
                  activeMenu === menu.title ? null : menu.title
                )
              }
            >
              {menu.title}
              <span className="menu-arrow">⌄</span>
            </button>

            {activeMenu === menu.title && (
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  {menu.groups.map((group) => (
                    <div className="mega-menu-group" key={group.heading}>
                      <h3>{group.heading}</h3>

                      {group.items.map((item) => (
                        <Link
                          key={item}
                          to={`/products?category=${createSlug(
                            item
                          )}&menu=${createSlug(menu.title)}`}
                          onClick={() => setActiveMenu(null)}
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mega-menu-special">
                  <span>NEW COLLECTION</span>
                  <strong>Bridal Jewellery</strong>
                  <Link to="/products?collection=bridal">
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