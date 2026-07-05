import os

EXCLUSIONS = {
    '.venv',
    '__pycache__',
    '.turbo',
    'node_modules',
    '.next',
    'pnpm-lock.yaml',
    'Context.md',
    '.git',
    '.pnpm-store',
    '.env',
    '.env.local',
    '.env.example',
}

def is_excluded(path, root_dir):
    rel_path = os.path.relpath(path, root_dir)
    parts = rel_path.split(os.sep)
    for part in parts:
        if part in EXCLUSIONS:
            return True
        if part.endswith('.pyc') or part.endswith('.pyd'):
            return True
    return False

def generate_tree(dir_path, prefix="", root_dir=None):
    if root_dir is None:
        root_dir = dir_path
    
    entries = []
    try:
        entries = sorted(os.listdir(dir_path))
    except PermissionError:
        return ""
    
    filtered_entries = []
    for entry in entries:
        full_path = os.path.join(dir_path, entry)
        if is_excluded(full_path, root_dir):
            continue
        filtered_entries.append(entry)
        
    tree_str = ""
    for i, entry in enumerate(filtered_entries):
        is_last = (i == len(filtered_entries) - 1)
        full_path = os.path.join(dir_path, entry)
        
        connector = "\\---" if is_last else "+---"
        if os.path.isdir(full_path):
            tree_str += f"{prefix}{connector}{entry}\n"
            next_prefix = prefix + ("    " if is_last else "|   ")
            tree_str += generate_tree(full_path, next_prefix, root_dir)
        else:
            tree_str += f"{prefix}{connector}{entry}\n"
            
    return tree_str

def main():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    context_file = os.path.join(root_dir, 'Context.md')
    
    print("Generating project tree...")
    tree_str = "Folder PATH listing\nC:.\n"
    tree_str += generate_tree(root_dir, root_dir=root_dir)
    
    print("Collecting file contents...")
    file_contents = []
    for root, dirs, files in os.walk(root_dir):
        # Filter directories in-place to prevent walking down excluded ones
        dirs[:] = [d for d in dirs if not is_excluded(os.path.join(root, d), root_dir)]
        
        for file in sorted(files):
            full_path = os.path.join(root, file)
            if is_excluded(full_path, root_dir):
                continue
            
            rel_path = os.path.relpath(full_path, root_dir)
            print(f"Adding {rel_path}...")
            
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            except Exception as e:
                content = f"<Error reading file: {e}>\n"
                
            file_contents.append((rel_path, content))
            
    print(f"Writing to {context_file}...")
    with open(context_file, 'w', encoding='utf-8') as f:
        f.write("# Anemo - Complete Project Context\n\n")
        f.write("This document contains the entire project structure and full source code for Anemo.\n\n")
        f.write("## Directory Structure\n\n")
        f.write("```text\n")
        f.write(tree_str)
        f.write("```\n\n")
        f.write("## Source Code\n\n")
        
        for rel_path, content in file_contents:
            f.write(f"### File: {rel_path.replace(os.sep, '/')}\n\n")
            f.write("```\n")
            f.write(content)
            if not content.endswith('\n'):
                f.write("\n")
            f.write("```\n\n")
            
    print("Done!")

if __name__ == '__main__':
    main()
