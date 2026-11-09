import eventsData from "../data/eventsData.js";

// =========================================
// 0. MATH HELPER
// =========================================
const parsePrice = (price) => {
  if (typeof price === "number") return price;
  if (!price) return 0;
  return Number(String(price).replace(/[^0-9.]/g, '')) || 0;
};

// =========================================
// 1. SPA TAB NAVIGATION & CACHE SYSTEM
// =========================================
const navTabs = document.querySelectorAll(".nav-tab, .nav-logo");
const tabContents = document.querySelectorAll(".tab-content");

const switchTab = (targetId) => {
  const targetContent = document.getElementById(targetId);
  if (!targetId || !targetContent) return;

  document.querySelectorAll(".nav-tab").forEach((item) => item.classList.remove("active"));
  const activeTab = document.querySelector(`.nav-tab[data-target="${targetId}"]`);
  if (activeTab) activeTab.classList.add("active");

  tabContents.forEach((content) => content.classList.remove("active"));
  targetContent.classList.add("active");
};

navTabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    if (!tab.getAttribute("href") || tab.getAttribute("href") === "#") {
      event.preventDefault();
    }
    switchTab(tab.getAttribute("data-target"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

const savedState = sessionStorage.getItem("vortex_page_state");
const initialHash = window.location.hash.substring(1);

if (savedState) {
  const { tab, scrollY } = JSON.parse(savedState);
  switchTab(tab);
  setTimeout(() => window.scrollTo(0, scrollY), 50);
  sessionStorage.removeItem("vortex_page_state");
} else if (initialHash) {
  switchTab(initialHash);
}

window.addEventListener("beforeunload", () => {
  const activeTab = document.querySelector(".nav-tab.active");
  if (activeTab) {
    sessionStorage.setItem("vortex_page_state", JSON.stringify({
      tab: activeTab.getAttribute("data-target"),
      scrollY: window.scrollY
    }));
  }
});

// =========================================
// 2. THEME TOGGLE
// =========================================
const themeBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const htmlElement = document.documentElement;

let savedTheme = "dark";
try { savedTheme = localStorage.getItem("vortex_theme") || "dark"; } catch (e) {}
htmlElement.setAttribute("data-theme", savedTheme);
if (themeIcon) themeIcon.className = savedTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";

themeBtn?.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  htmlElement.setAttribute("data-theme", newTheme);
  if (themeIcon) themeIcon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  try { localStorage.setItem("vortex_theme", newTheme); } catch(e) {}
});

// =========================================
// 3. CART SIDEBAR & CLEAR CART
// =========================================
const cartToggleBtn = document.getElementById("cartToggleBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const emptyCartBtn = document.getElementById("emptyCartBtn");

cartToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  cartSidebar?.classList.add("active");
});

closeCartBtn?.addEventListener("click", () => {
  cartSidebar?.classList.remove("active");
});

emptyCartBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (cart.length > 0) {
    cart = [];
    saveCart();
    updateCartUI();
  }
});

// =========================================
// 3.5 FLYING PARTICLE ANIMATION LOGIC
// =========================================
const spawnFlyingParticle = (startX, startY, endX, endY, isRemoving = false) => {
  const particle = document.createElement("div");
  particle.className = "flying-particle";
  
  if (isRemoving) {
    particle.style.background = "#ff4757"; 
    particle.style.boxShadow = "0 0 15px #ff4757, 0 0 25px #ff4757";
  }

  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  document.body.appendChild(particle);

  void particle.offsetWidth;

  particle.style.transform = `translate3d(${endX - startX}px, ${endY - startY}px, 0) scale(0.2)`;
  particle.style.opacity = "0.2";

  setTimeout(() => particle.remove(), 900);
};

// =========================================
// 4. EVENT RENDERING
// =========================================
const renderCategory = (categoryId, containerId) => {
  const items = eventsData.filter((event) => event.cat === categoryId || event.category === categoryId);
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren();

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.id = `card-${item.id}`;

    const info = document.createElement("div");
    info.className = "event-info";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.desc;

    const price = document.createElement("div");
    price.className = "event-price";
    price.textContent = `₹${parsePrice(item.price)}`;

    info.append(title, description, price);

    const infoButton = document.createElement("a");
    infoButton.className = "action-btn btn-info info-link";
    infoButton.textContent = "Info";
    infoButton.href = `./data/details/${item.id}.html`;
    infoButton.setAttribute("aria-label", `More information about ${item.name}`);

    // CART BUTTON CREATION
    const cartButton = document.createElement("button");
    cartButton.className = "action-btn btn-cart";
    cartButton.setAttribute("data-event-id", item.id); // Added ID tracking for sync
    cartButton.style.marginLeft = "10px";
    cartButton.style.borderColor = "var(--primary-purple)";

    // Set initial state based on whether the item is already in the cart on page load
    const isAdded = cart.some((cItem) => cItem.id === item.id);
    if (isAdded) {
      cartButton.textContent = "Added";
      cartButton.classList.add("added-to-cart");
      cartButton.style.background = "var(--primary-purple)";
      cartButton.style.color = "#fff";
      cartButton.style.cursor = "default";
    } else {
      cartButton.textContent = "Add to Cart";
      cartButton.style.background = "transparent";
      cartButton.style.color = "var(--primary-purple)";
      cartButton.style.cursor = "pointer";
    }

    // Hover effects (Disabled if already added)
    cartButton.addEventListener("mouseenter", () => {
      if (cartButton.classList.contains("added-to-cart")) return;
      cartButton.style.background = "var(--primary-purple)";
      cartButton.style.color = "#fff";
      cartButton.style.boxShadow = "0 0 12px rgba(189, 0, 255, 0.4)";
    });
    cartButton.addEventListener("mouseleave", () => {
      if (cartButton.classList.contains("added-to-cart")) return;
      cartButton.style.background = "transparent";
      cartButton.style.color = "var(--primary-purple)";
      cartButton.style.boxShadow = "none";
    });

    cartButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (cartButton.classList.contains("added-to-cart")) return; // Prevent double-adding
      window.handleAddToCart(item.id, item.name, item.category || item.cat, e.currentTarget);
    });

    const btnContainer = document.createElement("div");
    btnContainer.style.position = "relative";
    btnContainer.style.zIndex = "10";
    btnContainer.append(infoButton, cartButton);

    card.append(info, btnContainer);
    container.appendChild(card);
  });
};

// =========================================
// 5. CART STATE
// =========================================
let cart = [];

try {
  const storedCart = JSON.parse(localStorage.getItem("vortex_cart") || "[]");
  if (Array.isArray(storedCart)) {
    cart = storedCart.filter(item => item && ["general", "prodigy", "pharma"].includes(item.category));
  }
} catch { cart = []; }

cart = cart.map((item) => {
  const eventRecord = eventsData.find((e) => e.id === item.id);
  return { ...item, price: eventRecord ? parsePrice(eventRecord.price) : parsePrice(item.price) };
});

let previousDiscountPercent = 0;
const saveCart = () => { try { localStorage.setItem("vortex_cart", JSON.stringify(cart)); } catch(e) {} };
const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Initialize the grid AFTER cart state is loaded so the buttons know if they are already "Added"
try {
  renderCategory("general", "grid-general");
  renderCategory("prodigy", "grid-prodigy");
  renderCategory("pharma", "grid-pharma");
} catch(e) {
  console.error("Error rendering categories:", e);
}

// =========================================
// 6. DISCOUNT CALCULATION
// =========================================
const getCartBilling = () => {
  const eligibleItems = cart.filter((item) => item.id !== "sridp");
  const ineligibleItems = cart.filter((item) => item.id === "sridp");

  const counts = { general: 0, prodigy: 0, pharma: 0 };
  eligibleItems.forEach((item) => { if (Object.hasOwn(counts, item.category)) counts[item.category]++; });

  let completedSeries = 0;
  if (counts.general === 5) completedSeries++;
  if (counts.prodigy === 4) completedSeries++;
  if (counts.pharma === 5) completedSeries++;

  let discountPercent = 0;
  let message = "Add more events to unlock series discounts!";

  if (completedSeries === 3) {
    discountPercent = 0.7;
    message = "All 3 series complete — 70% discount applied!";
  } else if (completedSeries === 2) {
    discountPercent = 0.62;
    message = "2 series complete — 62% discount applied!";
  } else if (completedSeries === 1) {
    discountPercent = 0.6;
    message = "1 full series complete — 60% discount applied!";
  } else if (eligibleItems.length >= 5) {
    discountPercent = 0.5;
    message = "5+ eligible events — 50% discount applied!";
  } else if (eligibleItems.length > 0) {
    message = `Add ${Math.max(0, 5 - eligibleItems.length)} more eligible event(s) for 50% off.`;
  }

  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const excludedSubtotal = ineligibleItems.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const discount = eligibleSubtotal * discountPercent;
  const total = eligibleSubtotal - discount + excludedSubtotal;

  return { subtotal, discount, total, discountPercent, message };
};

// =========================================
// 7. CART SUMMARY
// =========================================
const calculateCartTotals = () => {
  const billing = getCartBilling();
  const cartSubtotal = document.getElementById("cartSubtotal");
  const discountLabel = document.getElementById("discountLabel");
  const cartDiscount = document.getElementById("cartDiscount");
  const cartTotal = document.getElementById("cartTotal");
  const message = document.getElementById("discountMsg");

  if (cartSubtotal) cartSubtotal.textContent = formatINR(billing.subtotal);
  if (discountLabel) discountLabel.textContent = `Discount (${billing.discountPercent * 100}%)`;
  if (cartDiscount) cartDiscount.textContent = `-${formatINR(billing.discount)}`;
  if (cartTotal) cartTotal.textContent = formatINR(billing.total);
  if (message) message.textContent = billing.message;

  if (billing.discountPercent > previousDiscountPercent) {
    const discountContainer = document.getElementById("discountContainer");
    discountContainer?.classList.remove("celebrate-animation");
    if (discountContainer) {
      requestAnimationFrame(() => requestAnimationFrame(() => discountContainer.classList.add("celebrate-animation")));
    }
    if (message) {
      message.style.color = "var(--success-green)";
      setTimeout(() => message.style.color = "var(--primary-cyan)", 1200);
    }
  }
  previousDiscountPercent = billing.discountPercent;
};

// =========================================
// 8. UPDATE CART UI & HANDLERS
// =========================================
const updateCartUI = () => {
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) cartCountEl.textContent = cart.length;

  const emptyBtn = document.getElementById("emptyCartBtn");
  if (emptyBtn) emptyBtn.style.display = cart.length === 0 ? "none" : "flex";

  const list = document.getElementById("cartItemsList");
  if (list) {
      list.replaceChildren();

      if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.style.color = "var(--text-muted)";
        empty.style.textAlign = "center";
        empty.style.marginTop = "2rem";
        empty.textContent = "Cart is empty.";
        list.appendChild(empty);
      } else {
        cart.forEach((item) => {
            const row = document.createElement("div");
            row.className = "cart-item";

            const details = document.createElement("div");
            details.className = "item-details";

            const name = document.createElement("h4");
            name.textContent = item.name;
            const category = document.createElement("p");
            category.textContent = `${item.category} Series`;

            details.append(name, category);

            const right = document.createElement("div");
            right.style.display = "flex";
            right.style.alignItems = "center";
            right.style.gap = "1rem";

            const price = document.createElement("span");
            price.style.fontFamily = "'Orbitron'";
            price.style.fontSize = "0.85rem";
            price.textContent = formatINR(item.price);

            const removeButton = document.createElement("button");
            removeButton.className = "remove-item";
            removeButton.setAttribute("aria-label", `Remove ${item.name} from cart`);

            const icon = document.createElement("i");
            icon.className = "fa-solid fa-trash";
            removeButton.appendChild(icon);

            removeButton.addEventListener("click", (e) => {
              e.stopPropagation(); 
              window.handleRemoveFromCart(item.id, e.currentTarget);
            });

            right.append(price, removeButton);
            row.append(details, right);
            list.appendChild(row);
        });
      }
  }

  calculateCartTotals();

  // SYNC ALL GRID BUTTONS WITH CART STATE
  const allCartButtons = document.querySelectorAll(".btn-cart[data-event-id]");
  allCartButtons.forEach(btn => {
    const eventId = btn.getAttribute("data-event-id");
    const isInCart = cart.some(cItem => cItem.id === eventId);
    
    if (isInCart) {
      btn.textContent = "Added";
      btn.classList.add("added-to-cart");
      btn.style.background = "var(--primary-purple)";
      btn.style.color = "#fff";
      btn.style.cursor = "default";
      btn.style.boxShadow = "none"; // Clears hover glow if clicked
    } else {
      btn.textContent = "Add to Cart";
      btn.classList.remove("added-to-cart");
      btn.style.background = "transparent";
      btn.style.color = "var(--primary-purple)";
      btn.style.cursor = "pointer";
    }
  });
};

window.handleAddToCart = (id, name, category, btnElement) => {
  if (cart.some((item) => item.id === id)) return;
  const eventRecord = eventsData.find((e) => e.id === id);
  const itemPrice = eventRecord ? parsePrice(eventRecord.price) : 0;
  
  cart.push({ id, name, category, price: itemPrice });
  saveCart();
  updateCartUI();

  if (btnElement && cartToggleBtn) {
    const btnRect = btnElement.getBoundingClientRect();
    const iconRect = cartToggleBtn.getBoundingClientRect();
    spawnFlyingParticle(
      btnRect.left + btnRect.width / 2, 
      btnRect.top + btnRect.height / 2,
      iconRect.left + iconRect.width / 2, 
      iconRect.top + iconRect.height / 2
    );
  }
};

window.handleRemoveFromCart = (id, removeBtnElement) => {
  if (removeBtnElement) {
    const startRect = removeBtnElement.getBoundingClientRect();
    const eventCard = document.getElementById(`card-${id}`);
    
    let endX = window.innerWidth / 2;
    let endY = window.innerHeight; 

    if (eventCard) {
      const cardRect = eventCard.getBoundingClientRect();
      if (cardRect.top >= 0 && cardRect.bottom <= window.innerHeight) {
        endX = cardRect.left + cardRect.width / 2;
        endY = cardRect.top + cardRect.height / 2;
      }
    }
    
    spawnFlyingParticle(
      startRect.left + startRect.width / 2, startRect.top + startRect.height / 2,
      endX, endY, 
      true
    );
  }

  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartUI();
};

// =========================================
// 9. SVG PIE INTERACTIONS
// =========================================
const pieSlices = document.querySelectorAll(".pie-slice");
const tip = document.getElementById("nodeTip");

pieSlices.forEach((slice) => {
  slice.addEventListener("mouseenter", () => {
    tip.querySelector("strong").textContent = slice.getAttribute("data-title");
    tip.querySelector("span").textContent = slice.getAttribute("data-text");
    tip.classList.add("show");
  });
  slice.addEventListener("mousemove", (event) => {
    tip.style.left = `${event.clientX}px`;
    tip.style.top = `${event.clientY - 46}px`;
  });
  slice.addEventListener("mouseleave", () => tip.classList.remove("show"));
  slice.addEventListener("click", () => {
    tip.classList.remove("show");
    document.querySelector(`.nav-tab[data-target="${slice.getAttribute("data-target")}"]`)?.click();
  });
});

// =========================================
// 10. MOBILE MENU & GLOBAL CLICK CLOSER
// =========================================
const menuBtn = document.getElementById("menuToggleBtn");
const navLinksEl = document.querySelector(".nav-links");

const closeMenu = () => {
  menuBtn?.classList.remove("open");
  navLinksEl?.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
};

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = navLinksEl.classList.toggle("open");
  menuBtn.classList.toggle("open", isOpen);
  menuBtn.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) cartSidebar?.classList.remove("active");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".navbar") && !event.target.closest(".cart-sidebar")) {
    closeMenu();
    if (cartSidebar) cartSidebar.classList.remove("active");
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768 && typeof animate === "function") animate();
});

const navbarEl = document.querySelector(".navbar");
let lastScrollY = window.scrollY;

const handleNavbarScroll = () => {
  const currentY = Math.max(window.scrollY, 0);
  const delta = currentY - lastScrollY;

  if (Math.abs(delta) > 8) {
    const menuOpen = navLinksEl?.classList.contains("open");
    if (delta > 0 && currentY > navbarEl.offsetHeight && !menuOpen) {
      navbarEl.classList.add("nav-hidden");
      document.body.classList.add("nav-is-hidden");
    } else if (delta < 0) {
      navbarEl.classList.remove("nav-hidden");
      document.body.classList.remove("nav-is-hidden");
    }
    lastScrollY = currentY;
  }
  if (currentY <= 0) {
    navbarEl.classList.remove("nav-hidden");
    document.body.classList.remove("nav-is-hidden");
  }
};

window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 50 });
    }
});

updateCartUI();