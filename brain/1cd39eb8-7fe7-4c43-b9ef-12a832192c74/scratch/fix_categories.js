const fs = require('fs');
const filePath = 'D:\\my-store-frontend\\app\\admin\\categories\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The submitForm function is broken - replace it entirely
// Find the start of submitForm
const submitStart = content.indexOf('  async function submitForm(event: FormEvent<HTMLFormElement>)');
if (submitStart === -1) {
  console.error('submitForm not found!');
  process.exit(1);
}

// Find from submitStart to the "return (" that begins the JSX
const returnStart = content.indexOf('  return (', submitStart);
if (returnStart === -1) {
  console.error('return ( not found!');
  process.exit(1);
}

const beforeSubmit = content.substring(0, submitStart);
const afterFunctions = content.substring(returnStart);

const newFunctions = `  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const CategoryName = form.CategoryName.trim();
    const ImageUrl = form.ImageUrl.trim() || null;
    if (!CategoryName) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }

    setSaving(true);
    setFormError('');
    setError('');
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.CategoryID, { CategoryName, ImageUrl });
        setSuccess(\`Đã cập nhật danh mục "\${CategoryName}".\`);
      } else {
        await api.createCategory({ CategoryName, ImageUrl });
        setSuccess(\`Đã tạo danh mục "\${CategoryName}".\`);
      }
      void reloadCat(true);
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!categoryToDelete) return;
    setDeletingId(categoryToDelete.CategoryID);
    setError('');
    const name = categoryToDelete.CategoryName;
    try {
      await api.deleteCategory(categoryToDelete.CategoryID);
      void reloadCat(true);
      setCategoryToDelete(null);
      setSuccess(\`Đã xóa danh mục "\${name}".\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa danh mục.');
      setCategoryToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

`;

content = beforeSubmit + newFunctions + afterFunctions;
fs.writeFileSync(filePath, content, 'utf8');
console.log('Categories: submitForm and deleteCategory fixed');
console.log('Total lines:', content.split('\n').length);
