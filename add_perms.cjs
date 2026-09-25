const fs = require('fs');
const path = require('path');

const targetFiles = [
  {
    file: 'frontend/src/pages/AllMaterialsPage.jsx',
    menuId: 'materials_list',
    addMenuId: 'materials_add'
  },
  {
    file: 'frontend/src/pages/AllServicesPage.jsx',
    menuId: 'services_list',
    addMenuId: 'services_new'
  },
  {
    file: 'frontend/src/pages/CategoriesPage.jsx',
    menuId: 'categories',
    addMenuId: 'categories_create'
  },
  {
    file: 'frontend/src/pages/RoleListPage.jsx',
    menuId: 'roles_list',
    addMenuId: 'roles_add'
  },
  {
    file: 'frontend/src/pages/UserListPage.jsx',
    menuId: 'users_list',
    addMenuId: 'users_add'
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
  // ADD NEW / CREATE NEW (usually has a Plus icon)
  // This is tricky, let's just do it manually for buttons.
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${file}`);
}

targetFiles.forEach(processFile);
