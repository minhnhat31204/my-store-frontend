const fs = require('fs');

let page = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\page.tsx', 'utf8');

// 1. Add import
page = page.replace(
  "import { useAdminData } from '@/lib/useAdminData';",
  "import { useAdminData } from '@/lib/useAdminData';\nimport { exportDashboardRevenueReport } from '@/lib/exportRevenueReport';"
);

// 2. Replace the old exportRevenueCsv function
const oldFuncRegex = /  function exportRevenueCsv\(\) \{[\s\S]*?  \}/;

const newFunc = `  function exportRevenueExcel() {
    exportDashboardRevenueReport({
      year,
      selectedMonth,
      deliveredOrders,
      allOrders: orders,
      products,
      userCount,
    });
  }`;

page = page.replace(oldFuncRegex, newFunc);

// 3. Update button in JSX to call exportRevenueExcel and change UI
page = page.replace(
  `onClick={exportRevenueCsv}`,
  `onClick={exportRevenueExcel}`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\page.tsx', page, 'utf8');
console.log('Successfully upgraded Dashboard Excel Report!');
