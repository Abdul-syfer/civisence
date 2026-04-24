import os
import re

def check_case_sensitivity(root_dir):
    all_files = {}
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, root_dir).replace('\\', '/')
            all_files[rel_path.lower()] = rel_path

    errors = []
    import_regex = re.compile(r'from\s+[\'"](.+?)[\'"]|import\s+[\'"](.+?)[\'"]')
    
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                full_path = os.path.join(root, f)
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                    matches = import_regex.findall(content)
                    for match in matches:
                        import_path = match[0] or match[1]
                        if import_path.startswith('.'):
                            # Resolve relative path
                            current_rel_dir = os.path.relpath(root, root_dir).replace('\\', '/')
                            if current_rel_dir == '.':
                                current_rel_dir = ''
                            
                            # Normalize import path
                            parts = import_path.split('/')
                            # Handle different extensions
                            possible_exts = ['', '.ts', '.tsx', '.js', '.jsx', '.css', '.svg', '.png', '.jpg', '/index.ts', '/index.tsx']
                            found = False
                            for ext in possible_exts:
                                test_path = os.path.normpath(os.path.join(current_rel_dir, import_path + ext)).replace('\\', '/')
                                if test_path.lower() in all_files:
                                    if all_files[test_path.lower()] != test_path:
                                        errors.append(f"Case mismatch in {f}: imported '{import_path}' (resolved to '{test_path}') but file is '{all_files[test_path.lower()]}'")
                                    found = True
                                    break
                            # Note: we don't error if not found, as it might be an alias or complex path

    return errors

if __name__ == "__main__":
    results = check_case_sensitivity('.')
    if results:
        for err in results:
            print(err)
    else:
        print("No case mismatches found.")
