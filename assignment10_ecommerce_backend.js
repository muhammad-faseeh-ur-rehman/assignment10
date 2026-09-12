let users = [];
let products = [];
let carts = [];
let orders = [];
let nextUserId = 1;
let nextProductId = 1;
let nextOrderId = 1;
function registerUser(name, email, password, address) {
    if (!name || !email || !password || !address) {
        return "All user fields are required.";
    }
    if (users.some(user =>
        user.email.toLowerCase() === email.toLowerCase()
    )) {
        return "Email already registered.";
    }
    const user = {
        id: nextUserId++,
        name,
        email,
        password,
        address
    };
    users.push(user);
    carts.push({
        userId: user.id,
        products: []
    });
    return user;
}
function loginUser(email, password) {
    const user = users.find(user =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password
    );
    return user || "Invalid email or password.";
}
function getUser(userId) {
    return users.find(user => user.id === userId) || null;
}
function updateUser(userId, updatedData) {
    const user = getUser(userId);
    if (!user) return "User not found.";
    Object.assign(user, updatedData);
    return user;
}
function deleteUser(userId) {
    const index = users.findIndex(user => user.id === userId);
    if (index === -1) return "User not found.";
    users.splice(index, 1);
    carts = carts.filter(cart => cart.userId !== userId);
    orders = orders.filter(order => order.userId !== userId);
    return "User deleted.";
}
function addProduct(name, category, price, stock, ratings = []) {
    if (!name || !category || price < 0 || stock < 0) {
        return "Invalid product data.";
    }
    const product = {
        id: nextProductId++,
        name,
        category,
        price,
        stock,
        ratings
    };
    products.push(product);
    return product;
}
function deleteProduct(productId) {
    const index = products.findIndex(product =>
        product.id === productId
    );
    if (index === -1) return "Product not found.";
    products.splice(index, 1);
    return "Product deleted.";
}
function updateProduct(productId, updatedData) {
    const product = products.find(product =>
        product.id === productId
        );

    if (!product) return "Product not found.";

    Object.assign(product, updatedData);

    return product;
}

function searchProducts(keyword) {
    const text = keyword.toLowerCase();

    return products.filter(product =>
        product.name.toLowerCase().includes(text) ||
        product.category.toLowerCase().includes(text)
    );
}

function filterProducts(category, minPrice = 0, maxPrice = Infinity) {
    return products.filter(product =>
        product.category.toLowerCase() === category.toLowerCase() &&
        product.price >= minPrice &&
        product.price <= maxPrice
    );
}

function sortProducts(field = "price", direction = "asc") {
    return [...products].sort((a, b) => {
        if (direction === "asc") {
            return a[field] > b[field] ? 1 : -1;
        }

        return a[field] < b[field] ? 1 : -1;
    });
}

function getCart(userId) {
    return carts.find(cart => cart.userId === userId);
}

function addToCart(userId, productId, quantity = 1) {
    const cart = getCart(userId);
    const product = products.find(product => product.id === productId);

    if (!cart) return "Cart not found.";
    if (!product) return "Product not found.";
    if (quantity <= 0) return "Quantity must be greater than 0.";

    const existing = cart.products.find(item =>
        item.productId === productId
    );

    if (existing) {
        if (existing.quantity + quantity > product.stock) {
            return "Not enough stock.";
        }

        existing.quantity += quantity;
    } else {
        if (quantity > product.stock) return "Not enough stock.";

        cart.products.push({
            productId,
            quantity
        });
    }

    return cart;
}

function removeFromCart(userId, productId) {
    const cart = getCart(userId);

    if (!cart) return "Cart not found.";

    const index = cart.products.findIndex(item =>
        item.productId === productId
    );

    if (index === -1) return "Product not in cart.";

    cart.products.splice(index, 1);

    return cart;
}

function updateCartQuantity(userId, productId, quantity) {
    const cart = getCart(userId);
    const product = products.find(product => product.id === productId);

    if (!cart || !product) return "Cart or product not found.";
    if (quantity < 1) return "Quantity must be at least 1.";
    if (quantity > product.stock) return "Not enough stock.";

    const item = cart.products.find(item =>
        item.productId === productId
    );

    if (!item) return "Product not in cart.";

    item.quantity = quantity;

    return cart;
}

function clearCart(userId) {
    const cart = getCart(userId);

    if (!cart) return "Cart not found.";

    cart.products = [];

    return cart;
}

function getCartTotal(userId) {
    const cart = getCart(userId);

    if (!cart) return 0;

    return cart.products.reduce((total, item) => {
        const product = products.find(product =>
            product.id === item.productId
        );

        return total + product.price * item.quantity;
    }, 0);
}

function createOrder(userId) {
    const user = getUser(userId);
    const cart = getCart(userId);

    if (!user) return "User not found.";
    if (!cart || cart.products.length === 0) {
        return "Cart is empty.";
    }

    for (const item of cart.products) {
        const product = products.find(product =>
            product.id === item.productId
        );

        if (!product || item.quantity > product.stock) {
            return `Insufficient stock for product ID ${item.productId}.`;
        }
    }

    const orderProducts = cart.products.map(item => {
        const product = products.find(product =>
            product.id === item.productId
        );

        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
        };
    });

    const total = orderProducts.reduce((sum, item) =>
        sum + item.price * item.quantity, 0
    );

    cart.products.forEach(item => {
        const product = products.find(product =>
            product.id === item.productId
        );

        product.stock -= item.quantity;
    });

    const order = {
        id: nextOrderId++,
        userId,
        products: orderProducts,
        total,
        status: "pending",
        createdAt: new Date().toISOString()
    };

    orders.push(order);
    cart.products = [];

    return order;
}

function cancelOrder(orderId) {
    const order = orders.find(order => order.id === orderId);

    if (!order) return "Order not found.";
    if (order.status === "cancelled") return "Order already cancelled.";
    if (order.status === "delivered") return "Delivered order cannot be cancelled.";

    order.products.forEach(item => {
        const product = products.find(product =>
            product.id === item.productId
        );

        if (product) {
            product.stock += item.quantity;
        }
    });

    order.status = "cancelled";

    return order;
}

function updateOrderStatus(orderId, status) {
    const order = orders.find(order => order.id === orderId);

    if (!order) return "Order not found.";

    const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
    ];

    if (!validStatuses.includes(status)) {
        return "Invalid status.";
    }

    order.status = status;

    return order;
}

function getUserOrders(userId) {
    return orders.filter(order => order.userId === userId);
}

function getTotalRevenue() {
    return orders
        .filter(order => order.status !== "cancelled")
        .reduce((total, order) => total + order.total, 0);
}

function getBestSellingProduct() {
    const sales = {};

    orders.forEach(order => {
        if (order.status === "cancelled") return;

        order.products.forEach(item => {
            sales[item.productId] =
                (sales[item.productId] || 0) + item.quantity;
        });
    });

    const best = Object.entries(sales)
        .sort((a, b) => b[1] - a[1])[0];

    if (!best) return null;

    return {
        product: products.find(product =>
            product.id === Number(best[0])
        ),
        quantitySold: best[1]
    };
}

function getBestCustomer() {
    const spending = {};

    orders.forEach(order => {
        if (order.status === "cancelled") return;

        spending[order.userId] =
            (spending[order.userId] || 0) + order.total;
    });

    const best = Object.entries(spending)
        .sort((a, b) => b[1] - a[1])[0];

    if (!best) return null;

    return {
        user: getUser(Number(best[0])),
        totalSpent: best[1]
    };
}

function getLowStockProducts() {
    return products.filter(product =>
        product.stock > 0 && product.stock < 5
    );
}

function getTopRatedProducts() {
    return products
        .map(product => {
            const average =
                product.ratings.length === 0
                    ? 0
                    : product.ratings.reduce((sum, rating) =>
                        sum + rating, 0
                    ) / product.ratings.length;

            return {
                ...product,
                averageRating: average
            };
        })
        .sort((a, b) => b.averageRating - a.averageRating);
}

function getAdminReport() {
    const totalRevenue = getTotalRevenue();

    const activeOrders = orders.filter(order =>
        order.status !== "cancelled"
    );

    const averageOrderValue =
        activeOrders.length === 0
            ? 0
            : totalRevenue / activeOrders.length;

    const outOfStock =
        products.filter(product => product.stock === 0).length;

    console.log(`
Total Users: ${users.length}
Total Products: ${products.length}
Total Orders: ${orders.length}

Total Revenue: Rs. ${totalRevenue.toLocaleString()}

Best Selling Product:
${getBestSellingProduct()?.product?.name || "None"}

Best Customer:
${getBestCustomer()?.user?.name || "None"}

Low Stock Products:
${getLowStockProducts().length}

Out of Stock:
${outOfStock}

Average Order Value:
Rs. ${averageOrderValue.toLocaleString()}

    `);
}

const user = registerUser(
    "Ali",
    "ali@gmail.com",
    "12345",
    "Multan"
);

console.log("1. Registered:", user);

const loggedInUser = loginUser(
    "ali@gmail.com",
    "12345"
);

console.log("2. Login:", loggedInUser);

addProduct("iPhone 15", "Mobile", 250000, 10, [5, 4, 5]);
addProduct("Laptop", "Computer", 120000, 5, [4, 5, 5]);
addProduct("Mouse", "Accessories", 2500, 20, [4, 4, 5]);

console.log("3. Products:", products);

console.log("4. Search:", searchProducts("iphone"));

console.log("5. Add to Cart:",
    addToCart(user.id, 1, 2)
);

console.log("6. Update Quantity:",
    updateCartQuantity(user.id, 1, 3)
);

console.log("7. Cart Total:",
    getCartTotal(user.id)
);

const order = createOrder(user.id);

console.log("8-9. Created Order:", order);

console.log("10. Stock:", products);

console.log("11. User Orders:",
    getUserOrders(user.id)
);

console.log("12. Update Status:",
    updateOrderStatus(order.id, "delivered")
);

console.log("Best Selling:",
    getBestSellingProduct()
);

console.log("Best Customer:",
    getBestCustomer()
);

console.log("Top Rated:",
    getTopRatedProducts()
);

console.log("Low Stock:",
    getLowStockProducts()
);

getAdminReport();
