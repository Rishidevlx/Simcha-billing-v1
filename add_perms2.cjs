const fs = require('fs');
const path = require('path');

const targetFiles = [
  {
    file: 'frontend/src/pages/InventoryPage.jsx',
    menuId: 'inventory',
    addMenuId: 'inventory'
  },
  {
    file: 'frontend/src/pages/ReturnsAdjustmentsPage.jsx',
    menuId: 'returns_list',
    addMenuId: 'returns_new'
  }
];

function processFile({ file, menuId, addMenuId }) {
  const filePath = path.join('d:/Rishi Data/Company details/nextskill - tech/Simcha - Billing', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already processed
  if (content.includes('getUserPermissions')) {
    console.log(`Already processed: ${file}`);
    return;
  }

  // Inject import
  content = content.replace(/(import { API_ENDPOINTS } from '..\/config\/api')/, `$1\nimport { getUserPermissions } from '../utils/access'`);

  // Inject permissions logic inside the component
  const compMatch = content.match(/export default function \w+\(.*\) {/);
  if (!compMatch) {
    console.log(`Could not find component start in ${file}`);
    return;
  }

  const hookInjectStr = `
  const { can, hasAny } = getUserPermissions()
  const canAdd = can('${addMenuId}', 'Add') || can('${menuId}', 'Add') || can('${menuId.split('_')[0]}', 'Add')
  const canEdit = hasAny('${menuId}', ['Edit']) || hasAny('${addMenuId}', ['Edit']) || hasAny('${menuId.split('_')[0]}', ['Edit'])
  const canDelete = hasAny('${menuId}', ['Delete']) || hasAny('${addMenuId}', ['Delete']) || hasAny('${menuId.split('_')[0]}', ['Delete'])
  const canDownload = hasAny('${menuId}', ['Download']) || hasAny('${addMenuId}', ['Download']) || hasAny('${menuId.split('_')[0]}', ['Download'])
`;

  content = content.replace(compMatch[0], compMatch[0] + hookInjectStr);

  // For buttons like EXPORT / CREATE NEW
  // EXPORT TO EXCEL
  content = content.replace(/(<button[^>]*handleExportExcel[\s\S]*?<\/button>)/, '{canDownload && (\n$1\n)}');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${file}`);
}

targetFiles.forEach(processFile);
