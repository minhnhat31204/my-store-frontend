const fs = require('fs');

// ============================================
// 1. PATCH USERS: app/admin/users/page.tsx
// ============================================
let users = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', 'utf8');

// Add modal import
users = users.replace(
  "import Pagination from '@/app/admin/components/Pagination';",
  "import Pagination from '@/app/admin/components/Pagination';\nimport ConfirmDeleteModal from '@/app/admin/components/ConfirmDeleteModal';"
);

// Add state for deleting user
users = users.replace(
  "  const [updatingId, setUpdatingId] = useState<number | null>(null);",
  "  const [updatingId, setUpdatingId] = useState<number | null>(null);\n  const [deletingUser, setDeletingUser] = useState<User | null>(null);\n  const [isDeleting, setIsDeleting] = useState(false);"
);

// Update handleDelete logic
const oldUserDelete = `  async function handleDelete(userId: number) {\r\n    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?')) return;\r\n    try {\r\n      await api.deleteUser(userId);\r\n      void reload(true);\r\n    } catch (e) {\r\n      alert(e instanceof Error ? e.message : 'Xóa tài khoản thất bại');\r\n    }\r\n  }`;

const newUserDelete = `  async function handleConfirmDelete() {\r\n    if (!deletingUser) return;\r\n    setIsDeleting(true);\r\n    try {\r\n      await api.deleteUser(deletingUser.UserID);\r\n      void reload(true);\r\n      setDeletingUser(null);\r\n    } catch (e) {\r\n      alert(e instanceof Error ? e.message : 'Xóa tài khoản thất bại');\r\n    } finally {\r\n      setIsDeleting(false);\r\n    }\r\n  }`;

users = users.replace(oldUserDelete, newUserDelete);

// Update button onClick to open modal
users = users.replace(
  "onClick={() => void handleDelete(user.UserID)}",
  "onClick={() => setDeletingUser(user)}"
);

// Add modal to bottom of JSX
users = users.replace(
  "      <Pagination currentPage={currentPage} totalItems={filteredUsers.length} onPageChange={setPage} />\r\n    </div>",
  `      <Pagination currentPage={currentPage} totalItems={filteredUsers.length} onPageChange={setPage} />\r\n\r\n      <ConfirmDeleteModal\r\n        isOpen={Boolean(deletingUser)}\r\n        title="Xác nhận xóa tài khoản"\r\n        itemType="tài khoản người dùng"\r\n        itemName={deletingUser ? \`#\${deletingUser.UserID} - \${deletingUser.FullName || deletingUser.Username || 'Người dùng'}\` : ''}\r\n        description="Tài khoản này cùng toàn bộ thông tin đăng nhập sẽ bị xóa khỏi hệ thống."\r\n        isDeleting={isDeleting}\r\n        onConfirm={handleConfirmDelete}\r\n        onCancel={() => setDeletingUser(null)}\r\n      />\r\n    </div>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', users, 'utf8');
console.log('1. Replaced window.confirm with Modal in Users');

// ============================================
// 2. PATCH PRODUCTS: app/admin/products/page.tsx
// ============================================
let products = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', 'utf8');

// Add modal import
products = products.replace(
  "import Pagination from '@/app/admin/components/Pagination';",
  "import Pagination from '@/app/admin/components/Pagination';\nimport ConfirmDeleteModal from '@/app/admin/components/ConfirmDeleteModal';"
);

// Add state for deleting product
products = products.replace(
  "  const [open, setOpen] = useState(false);",
  "  const [open, setOpen] = useState(false);\n  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);\n  const [isDeleting, setIsDeleting] = useState(false);"
);

// Update remove function to confirm modal
const oldProdRemove = `  async function remove(id: number) {\r\n    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi hệ thống?')) return;\r\n    try {\r\n      await api.deleteProduct(id);\r\n      void reload(true);\r\n    } catch (e) {\\r\n      setError(e instanceof Error ? e.message : 'Xóa thất bại');\r\n    }\r\n  }`;

const newProdRemove = `  async function handleConfirmDelete() {\r\n    if (!deletingProduct) return;\r\n    setIsDeleting(true);\r\n    try {\r\n      await api.deleteProduct(deletingProduct.ProductID);\r\n      void reload(true);\r\n      setDeletingProduct(null);\r\n    } catch (e) {\r\n      setError(e instanceof Error ? e.message : 'Xóa thất bại');\r\n    } finally {\r\n      setIsDeleting(false);\r\n    }\r\n  }`;

products = products.replace(oldProdRemove, newProdRemove);
if (products.includes('async function remove')) {
  // If replacement didn't catch due to CRLF, replace by regex
  products = products.replace(
    /  async function remove\(id: number\) \{[\s\S]*?  \}/,
    newProdRemove
  );
}

// Update button onClick
products = products.replace(
  "onClick={() => void remove(item.ProductID)}",
  "onClick={() => setDeletingProduct(item)}"
);

// Add modal to bottom of JSX
products = products.replace(
  "      <Pagination currentPage={currentPage} totalItems={filteredProducts.length} onPageChange={setPage} />\r\n    </div>",
  `      <Pagination currentPage={currentPage} totalItems={filteredProducts.length} onPageChange={setPage} />\r\n\r\n      <ConfirmDeleteModal\r\n        isOpen={Boolean(deletingProduct)}\r\n        title="Xác nhận xóa sản phẩm"\r\n        itemType="sản phẩm"\r\n        itemName={deletingProduct ? \`#SP\${deletingProduct.ProductID} - \${deletingProduct.ProductName}\` : ''}\r\n        description="Toàn bộ hình ảnh, thông số cấu hình và các biến thể của sản phẩm này sẽ bị xóa khỏi kho hàng."\r\n        isDeleting={isDeleting}\r\n        onConfirm={handleConfirmDelete}\r\n        onCancel={() => setDeletingProduct(null)}\r\n      />\r\n    </div>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', products, 'utf8');
console.log('2. Replaced window.confirm with Modal in Products');

// ============================================
// 3. PATCH BANNERS: app/admin/banners/page.tsx
// ============================================
let banners = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', 'utf8');

// Add modal import
banners = banners.replace(
  "import Pagination from '@/app/admin/components/Pagination';",
  "import Pagination from '@/app/admin/components/Pagination';\nimport ConfirmDeleteModal from '@/app/admin/components/ConfirmDeleteModal';"
);

// Add state for deleting banner
banners = banners.replace(
  "  const [modalOpen, setModalOpen] = useState(false);",
  "  const [modalOpen, setModalOpen] = useState(false);\n  const [deletingBanner, setDeletingBanner] = useState<Promotion | null>(null);\n  const [isDeleting, setIsDeleting] = useState(false);"
);

// Replace handleDelete with modal logic
const oldBannerDelete = /  const handleDelete = async \(id\?: number\) => \{[\s\S]*?  \};/;

const newBannerDelete = `  const handleConfirmDelete = async () => {\r\n    if (!deletingBanner?.PromotionID) return;\r\n    setIsDeleting(true);\r\n    try {\r\n      await api.deletePromotion(deletingBanner.PromotionID);\r\n      setFeedback({ type: 'success', message: \`Đã xóa banner #\${deletingBanner.PromotionID} thành công.\` });\r\n      setDeletingBanner(null);\r\n      await reload(true);\r\n    } catch (err) {\r\n      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Không xóa được banner.' });\r\n    } finally {\r\n      setIsDeleting(false);\r\n    }\r\n  };`;

banners = banners.replace(oldBannerDelete, newBannerDelete);

// Update button onClick
banners = banners.replace(
  "onClick={() => handleDelete(p.PromotionID)}",
  "onClick={() => setDeletingBanner(p)}"
);

// Add modal to bottom of JSX
banners = banners.replace(
  "      <Pagination currentPage={promoCurrentPage} totalItems={filteredPromotions.length} onPageChange={setPage} />",
  `      <Pagination currentPage={promoCurrentPage} totalItems={filteredPromotions.length} onPageChange={setPage} />\r\n\r\n      <ConfirmDeleteModal\r\n        isOpen={Boolean(deletingBanner)}\r\n        title="Xác nhận xóa Banner"\r\n        itemType="banner khuyến mãi"\r\n        itemName={deletingBanner ? \`#\${deletingBanner.PromotionID} - \${deletingBanner.Title}\` : ''}\r\n        description="Banner này sẽ bị gỡ bỏ khỏi trang chủ và danh sách sự kiện ưu đãi của cửa hàng."\r\n        isDeleting={isDeleting}\r\n        onConfirm={handleConfirmDelete}\r\n        onCancel={() => setDeletingBanner(null)}\r\n      />`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', banners, 'utf8');
console.log('3. Replaced window.confirm with Modal in Banners');

console.log('\nAll delete confirmations upgraded to Custom UI Modals!');
