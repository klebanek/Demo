import os

files = {
    'navigation.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { Utils } from "./utils.js";', 'import { PageTemplates } from "./templates.js";', 'import { Notifications } from "./notifications.js";', 'import { Modal } from "./modal.js";', 'import { CrudManager } from "./crud.js";'],
        'var_name': 'Navigation'
    },
    'pdf-export.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { Utils } from "./utils.js";', 'import { storage } from "./storage.js";', 'import { Notifications } from "./notifications.js";', 'import { Modal } from "./modal.js";'],
        'var_name': 'PDFExport'
    },
    'reminders.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { Utils } from "./utils.js";', 'import { storage } from "./storage.js";', 'import { Notifications } from "./notifications.js";', 'import { Modal } from "./modal.js";'],
        'var_name': 'Reminders'
    },
    'dashboard-kpi.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { Utils } from "./utils.js";', 'import { storage } from "./storage.js";', 'import { Notifications } from "./notifications.js";', 'import { Modal } from "./modal.js";'],
        'var_name': 'DashboardKPI'
    },
    'global-search.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { Utils } from "./utils.js";', 'import { storage } from "./storage.js";', 'import { Navigation } from "./navigation.js";', 'import { Modal } from "./modal.js";'],
        'var_name': 'GlobalSearch'
    },
    'audit-log.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { storage } from "./storage.js";'],
        'var_name': 'AuditLog'
    },
    'dark-mode.js': {
        'imports': ['import { CONFIG } from "./config.js";', 'import { storage } from "./storage.js";'],
        'var_name': 'DarkMode'
    }
}

for filename, config in files.items():
    filepath = os.path.join('src/js', filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}, not found")
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    # Add imports
    imports_str = '\n'.join(config['imports']) + '\n'
    if not content.startswith('import'):
        content = imports_str + content

    # Export const
    content = content.replace(f'const {config["var_name"]} =', f'export const {config["var_name"]} =')

    # Remove footer
    if '// Export for ES6 modules' in content:
        parts = content.split('// Export for ES6 modules')
        content = parts[0]
    elif 'if (typeof module !==' in content:
        parts = content.split('if (typeof module !==')
        content = parts[0]

    with open(filepath, 'w') as f:
        f.write(content)

print("Conversion complete")
