const fs = require('fs');

let prod = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', 'utf8');

// The lines 517 to 532 have duplicated catch block
const broken = `  async function handleConfirmDelete() {\r\n    if (!deletingProduct) return;\r\n    setIsDeleting(true);\r\n    try {\r\n      await api.deleteProduct(deletingProduct.ProductID);\r\n      void reload(true);\r\n      setDeletingProduct(null);\r\n    } catch (e) {\r\n      setError(e instanceof Error ? e.message : 'Xóa thất bại');\r\n    } finally {\r\n      setIsDeleting(false);\r\n    }\r\n  } catch (e) {\r\n      setError(e instanceof Error ? e.message : 'Xóa thất bại');\r\n    }\r\n  }`;

const fixed = `  async function handleConfirmDelete() {\r\n    if (!deletingProduct) return;\r\n    setIsDeleting(true);\r\n    try {\r\n      await api.deleteProduct(deletingProduct.ProductID);\r\n      void reload(true);\r\n      setDeletingProduct(null);\r\n    } catch (e) {\r\n      setError(e instanceof Error ? e.message : 'Xóa thất bại');\r\n    } finally {\r\n      setIsDeleting(false);\r\n    }\r\n  }`;

prod = prod.replace(broken, fixed);
fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', prod, 'utf8');
console.log('Fixed handleConfirmDelete syntax in products');
